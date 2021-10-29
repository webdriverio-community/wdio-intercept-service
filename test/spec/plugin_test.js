'use strict';

const assert = require('assert');
const { remote } = require('webdriverio');
const WebdriverAjax = require('../../index').default;
// Since we serve the content from a file, the content-length depends on if the host is
// Windows (CRLF) or not (LF).
const contentLength = require('fs')
  .readFileSync(`${__dirname}/../site/get.json`, 'utf-8')
  .length.toString();

describe('webdriverajax', function testSuite() {
  this.timeout(process.env.CI ? 100000 : 10000);

  const wait = process.env.CI ? 10000 : 1000;

  it('sets up the interceptor', async function () {
    assert.equal(typeof browser.setupInterceptor, 'function');
    await browser.url('/get.html');
    await browser.setupInterceptor();
    const ret = await browser.execute(() => window.__webdriverajax);
    assert.deepEqual(ret, { requests: [] });
  });

  it('sets up the interceptor in standalone mode', async function () {
    const browser = await remote({
      port: 9515,
      path: '/',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless'],
        },
      },
    });

    const webdriverAjax = new WebdriverAjax();
    webdriverAjax.before(null, null, browser);

    assert.equal(typeof browser.setupInterceptor, 'function');
  });

  it('should reset expectations', async function () {
    assert.equal(typeof browser.setupInterceptor, 'function');
    await browser.url('/get.html');
    await browser.setupInterceptor();
    await browser.expectRequest('GET', '/get.json', 200);
    await browser.expectRequest('GET', '/get.json', 200);
    assert.equal((await browser.getExpectations()).length, 2);
    await browser.resetExpectations();
    assert.equal((await browser.getExpectations()).length, 0);
  });

  describe('XHR API', async function () {
    it('can intercept a simple GET request', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await $('#button').click();
      await browser.pause(wait);
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('can use regular expressions for urls', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', /get\.json/, 200);
      await $('#button').click();
      await browser.pause(wait);
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('errors on wrong request count', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await browser.expectRequest('GET', '/get.json', 200);
      await $('#button').click();
      await browser.pause(wait);
      assert.rejects(() => browser.assertRequests(), /Expected/);
    });

    it('errors on wrong method', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('PUT', '/get.json', 200);
      await $('#button').click();
      await browser.pause(wait);
      assert.rejects(() => browser.assertRequests(), /PUT/);
    });

    it('errors on wrong URL', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/wrong.json', 200);
      await $('#button').click();
      await browser.pause(wait);
      assert.rejects(() => browser.assertRequests(), /wrong\.json/);
    });

    it("errors if regex doesn't match URL", async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', /wrong\.json/, 200);
      await $('#button').click();
      await browser.pause(wait);
      assert.rejects(() => browser.assertRequests(), /get\.json/);
    });

    it('errors on wrong status code', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 404);
      await $('#button').click();
      await browser.pause(wait);
      assert.rejects(() => browser.assertRequests(), /404/);
    });

    it('can access a certain request', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await $('#button').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.equal(request.method, 'GET');
      assert.equal(request.url, '/get.json');
      assert.deepEqual(request.response.body, { OK: true });
      assert.equal(request.response.statusCode, 200);
      assert.equal(request.response.headers['content-length'], contentLength);
    });

    it('can get multiple requests at once', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await $('#button').click();
      await browser.pause(wait);
      await $('#button').click();
      await browser.pause(wait);
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 2);
      assert.equal(requests[0].method, 'GET');
      assert.equal(requests[1].method, 'GET');
    });

    it('can get multiple request one by one', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await $('#button').click();
      await browser.pause(wait);
      await $('#button').click();
      await browser.pause(wait);
      const firstRequest = await browser.getRequest(0);
      assert.equal(firstRequest.method, 'GET');
      const secondRequest = await browser.getRequest(1);
      assert.equal(secondRequest.method, 'GET');
    });

    it('survives page changes', async function () {
      await browser.url('/page_change.html');
      await browser.setupInterceptor();
      await $('#button1').click();
      await browser.pause(wait);
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 1);
      assert.equal(requests[0].method, 'GET');
    });

    it('survives page changes using multiple requests', async function () {
      await browser.url('/page_change.html');
      await browser.setupInterceptor();
      await $('#button1').click();
      await $('#button2').click();
      await browser.pause(wait);
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 2);
      assert.equal(requests[0].method, 'GET');
      assert.equal(requests[1].method, 'GET');
    });

    it('can assess the request body using string data', async function () {
      await browser.url('/post.html');
      await browser.setupInterceptor();
      await $('#buttonstring').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.equal(request.body, 'foobar');
    });

    it('can assess the request body using JSON data', async function () {
      await browser.url('/post.html');
      await browser.setupInterceptor();
      await $('#buttonjson').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.equal(request.headers['content-type'], 'application/json');
      assert.deepEqual(request.body, { foo: 'bar' });
    });

    it('can assess the request body using form data', async function () {
      await browser.url('/post.html');
      await browser.setupInterceptor();
      await $('#buttonform').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.deepEqual(request.body, { foo: ['bar'] });
    });

    it('can get initialised inside an iframe', async function () {
      await browser.url('/frame.html');
      await browser.setupInterceptor();
      const ret = await browser.execute(() => window.__webdriverajax);
      assert.deepEqual(ret, { requests: [] });
      const frame = await $('#getinframe');
      await frame.waitForExist();
      await browser.switchToFrame(frame);
      await browser.setupInterceptor();
      const frameRet = await browser.execute(() => window.__webdriverajax);
      assert.deepEqual(frameRet, { requests: [] });
      await browser.expectRequest('GET', '/get.json', 200);
      await $('#button').click();
      await browser.pause(wait);
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('errors with no requests set up', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      assert.rejects(() => browser.assertRequests(), /No\sexpectations\sfound/);
    });

    it('returns an empty array for no captured requests', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      const count = await browser.getRequests();
      assert.deepEqual(count, []);
    });

    it('can validate only the expected requests, in order (implicit)', async function () {
      await browser.url('/multiple_methods.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await browser.expectRequest('POST', '/post.json', 200);
      await $('#getbutton').click();
      await browser.pause(wait);
      await $('#postbutton').click();
      await browser.pause(wait);
      // The next two are not needed, but adding extra clicks to prove we can validate partial set
      await $('#getbutton').click();
      await browser.pause(wait);
      await $('#postbutton').click();
      await browser.pause(wait);
      await browser.assertExpectedRequestsOnly();
      assert.rejects(
        () => browser.assertRequests(),
        /Expected\s\d\srequests\sbut\swas\s\d/
      );
    });

    it('can validate only the expected requests, in order (explicit)', async function () {
      await browser.url('/multiple_methods.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await browser.expectRequest('POST', '/post.json', 200);
      await $('#getbutton').click();
      await browser.pause(wait);
      await $('#postbutton').click();
      await browser.pause(wait);
      // The next two are not needed, but adding extra clicks to prove we can validate partial set
      await $('#getbutton').click();
      await browser.pause(wait);
      await $('#postbutton').click();
      await browser.pause(wait);
      await browser.assertExpectedRequestsOnly(true);
      assert.rejects(
        () => browser.assertRequests(),
        /Expected\s\d\srequests\sbut\swas\s\d/
      );
    });

    it('can validate only the expected requests, in any order', async function () {
      await browser.url('/multiple_methods.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await browser.expectRequest('POST', '/post.json', 200);
      await $('#postbutton').click();
      await browser.pause(wait);
      await $('#postbutton').click();
      await browser.pause(wait);
      await $('#getbutton').click();
      await browser.pause(wait);
      await $('#getbutton').click();
      await browser.pause(wait);
      await browser.assertExpectedRequestsOnly(false);
      assert.rejects(
        () => browser.assertRequests(),
        /Expected\s\d\srequests\sbut\swas\s\d/
      );
    });

    it('can validate only the expected requests, in any order, and fail when urls do not match', async function () {
      await browser.url('/multiple_methods.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await browser.expectRequest('POST', '/invalid.json', 200);
      await $('#getbutton').click();
      await browser.pause(wait);
      await $('#postbutton').click();
      await browser.pause(wait);
      assert.rejects(
        () => browser.assertExpectedRequestsOnly(false),
        /Expected request was not found. method: POST url: \/invalid.json statusCode: 200/
      );
    });

    it('converts Blob response types', () => {
      browser.url('/get.html');
      browser.setupInterceptor();
      $('#blobbutton').click();
      browser.pause(wait);
      const request = browser.getRequest(0);
      assert.equal(request.method, 'GET');
      assert.equal(request.url, '/get.json');
      assert.equal(request.response.statusCode, 200);
      assert.equal(request.response.headers['content-length'], contentLength);
      assert.deepEqual(request.response.body, { OK: true });
    });
  });

  describe('fetch API', async function () {
    it('can intercept a simple GET request', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await $('#fetchbutton').click();
      await browser.pause(wait);
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('can access a certain request', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await $('#fetchbutton').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.equal(request.method, 'GET');
      assert.equal(request.url, '/get.json');
      assert.deepEqual(request.response.body, { OK: true });
      assert.equal(request.response.statusCode, 200);
      assert.equal(request.response.headers['content-length'], contentLength);
    });

    it('can assess the request body using string data', async function () {
      await browser.url('/postfetch.html');
      await browser.setupInterceptor();
      await $('#buttonstring').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.equal(request.body, 'foobar');
    });

    it('can assess the request body using JSON data', async function () {
      await browser.url('/postfetch.html');
      await browser.setupInterceptor();
      await $('#buttonjson').click();
      await browser.pause(wait);
      const request = await browser.getRequest(0);
      assert.equal(request.headers['content-type'], 'application/json');
      assert.deepEqual(request.body, { foo: 'bar' });
    });
  });
});
