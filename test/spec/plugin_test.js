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

  // Helper method to avoid waiting for the full timeout in order to have tests pass locally
  // and on CI platforms in a reasonable time. Assumes the given selector can be clicked, and
  // that the request initiated upon clicking will update the page text when it is done.
  const completedRequest = async function (sel) {
    const elem = await browser.$('#response');
    const initial = await elem.getText();
    browser.$(sel).click();
    return elem.waitUntil(
      async function () {
        return (await this.getText()) !== initial;
      },
      { timeout: wait, interval: 5 }
    );
  };

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
      await completedRequest('#button');
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('can intercept requests opened with URL objects', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', /\/get\.json/, 200);
      await completedRequest('#urlbutton');
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('can use regular expressions for urls', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', /get\.json/, 200);
      await completedRequest('#button');
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('errors on wrong request count', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 200);
      await browser.expectRequest('GET', '/get.json', 200);
      await completedRequest('#button');
      await assert.rejects(
        () => browser.assertRequests(),
        /Expected 2 requests but was 1/
      );
    });

    it('errors on wrong method', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('PUT', '/get.json', 200);
      await completedRequest('#button');
      await assert.rejects(
        () => browser.assertRequests(),
        /method PUT but was GET/
      );
    });

    it('errors on wrong URL', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/wrong.json', 200);
      await completedRequest('#button');
      await assert.rejects(
        () => browser.assertRequests(),
        /to have URL \/wrong\.json but was/
      );
    });

    it("errors if regex doesn't match URL", async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', /wrong\.json/, 200);
      await completedRequest('#button');
      await assert.rejects(
        () => browser.assertRequests(),
        (err) => {
          assert.match(err.message, /to match \/wrong\\.json\/ but was/);
          return true;
        }
      );
    });

    it('errors on wrong status code', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', '/get.json', 404);
      await completedRequest('#button');
      await assert.rejects(
        () => browser.assertRequests(),
        /status 404 but was 200/
      );
    });

    it('can access a certain request', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await completedRequest('#button');
      const request = await browser.getRequest(0);
      assert.equal(request.method, 'GET');
      assert.equal(request.url, '/get.json');
      assert.deepEqual(request.response.body, { OK: true });
      assert.equal(request.response.statusCode, 200);
      assert.equal(request.response.headers['content-length'], contentLength);
    });

    it('can access a certain angular 12 http client request', async function () {
      await browser.url('/angular.html');
      await browser.setupInterceptor();
      await completedRequest('#button');
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
      await completedRequest('#button');
      await completedRequest('#button');
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 2);
      assert.equal(requests[0].method, 'GET');
      assert.equal(requests[1].method, 'GET');
    });

    it('can get multiple requests one by one', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await completedRequest('#button');
      await completedRequest('#button');
      const firstRequest = await browser.getRequest(0);
      assert.equal(firstRequest.method, 'GET');
      const secondRequest = await browser.getRequest(1);
      assert.equal(secondRequest.method, 'GET');
    });

    it('orders requests by time of completion by default', async function () {
      await browser.url('/pending.html');
      await browser.setupInterceptor();
      await $('#slow')
        .click()
        .then(() => completedRequest('#fast'));
      await browser.pause(wait);
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 2);
      assert.equal(requests[0].body, 'fast');
      assert.equal(requests[1].body, 'slow');
    });

    it('can order requests by time of initiation', async function () {
      await browser.url('/pending.html');
      await browser.setupInterceptor();
      await $('#slow')
        .click()
        .then(() => completedRequest('#fast'));
      await browser.pause(wait);
      const requests = await browser.getRequests({ orderBy: 'START' });
      assert(Array.isArray(requests));
      assert.equal(requests.length, 2);
      assert.equal(requests[0].body, 'slow');
      assert.equal(requests[1].body, 'fast');
    });

    it('survives page changes', async function () {
      await browser.url('/page_change.html');
      await browser.setupInterceptor();
      await completedRequest('#redirect');
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 1);
      assert.equal(requests[0].method, 'GET');
    });

    it('survives page changes using multiple requests', async function () {
      await browser.url('/page_change.html');
      await browser.setupInterceptor();
      await completedRequest('#stay');
      await completedRequest('#redirect');
      const requests = await browser.getRequests();
      assert(Array.isArray(requests));
      assert.equal(requests.length, 2);
      assert.equal(requests[0].method, 'GET');
      assert.equal(requests[1].method, 'GET');
    });

    it('can assess the request body using string data', async function () {
      await browser.url('/post.html');
      await browser.setupInterceptor();
      await completedRequest('#buttonstring');
      const request = await browser.getRequest(0);
      assert.equal(request.body, 'foobar');
    });

    it('can assess the request body using JSON data', async function () {
      await browser.url('/post.html');
      await browser.setupInterceptor();
      await completedRequest('#buttonjson');
      const request = await browser.getRequest(0);
      assert.equal(request.headers['content-type'], 'application/json');
      assert.deepEqual(request.body, { foo: 'bar' });
    });

    it('can assess the request body using form data', async function () {
      await browser.url('/post.html');
      await browser.setupInterceptor();
      await completedRequest('#buttonform');
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
      await completedRequest('#button');
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('errors with no requests set up', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await assert.rejects(
        () => browser.assertRequests(),
        /No\sexpectations\sfound/
      );
    });

    it('returns an empty array for no captured requests', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      const count = await browser.getRequests();
      assert.deepEqual(count, []);
    });

    [
      { kind: 'implicit', args: undefined },
      { kind: 'explicit', args: { inOrder: true } },
      { kind: 'legacy syntax', args: true },
    ].forEach(({ kind, args }) => {
      it(`can validate only the expected requests, in order (${kind})`, async function () {
        await browser.url('/multiple_methods.html');
        await browser.setupInterceptor();
        await browser.expectRequest('GET', '/get.json', 200);
        await browser.expectRequest('POST', '/post.json', 200);
        await completedRequest('#getbutton');
        await completedRequest('#postbutton');
        // The next two are not needed, but adding extra clicks to prove we can validate partial set
        await completedRequest('#getbutton');
        await completedRequest('#postbutton');
        await browser.assertExpectedRequestsOnly(args);
        await assert.rejects(
          () => browser.assertRequests(),
          /Expected\s\d\srequests\sbut\swas\s\d/
        );
      });
    });

    [
      { kind: '', args: { inOrder: false } },
      { kind: ' with legacy syntax', args: false },
    ].forEach(({ kind, args }) => {
      it(`can validate only the expected requests, in any order${
        kind || ''
      }`, async function () {
        await browser.url('/multiple_methods.html');
        await browser.setupInterceptor();
        await browser.expectRequest('GET', '/get.json', 200);
        await browser.expectRequest('POST', '/post.json', 200);
        await completedRequest('#postbutton');
        await completedRequest('#postbutton');
        await completedRequest('#getbutton');
        await completedRequest('#getbutton');
        await browser.assertExpectedRequestsOnly(args);
        await assert.rejects(
          () => browser.assertRequests(),
          /Expected\s\d\srequests\sbut\swas\s\d/
        );
      });
      it(`can validate only the expected requests, in any order${
        kind || ''
      }, and fail when urls do not match`, async function () {
        await browser.url('/multiple_methods.html');
        await browser.setupInterceptor();
        await browser.expectRequest('GET', '/get.json', 200);
        await browser.expectRequest('POST', '/invalid.json', 200);
        await completedRequest('#getbutton');
        await completedRequest('#postbutton');
        await assert.rejects(
          () => browser.assertExpectedRequestsOnly(args),
          /Expected request was not found. method: POST url: \/invalid.json statusCode: 200/
        );
      });
    });

    it('converts Blob response types', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await completedRequest('#blobbutton');
      const request = await browser.getRequest(0);
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
      await completedRequest('#fetchbutton');
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('can intercept when input is URL object', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await browser.expectRequest('GET', /\/get\.json/, 200);
      await completedRequest('#urlfetchbutton');
      await browser.assertRequests();
      await browser.assertExpectedRequestsOnly();
    });

    it('can access a certain request', async function () {
      await browser.url('/get.html');
      await browser.setupInterceptor();
      await completedRequest('#fetchbutton');
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
      await completedRequest('#buttonstring');
      const request = await browser.getRequest(0);
      assert.equal(request.body, 'foobar');
    });

    it('can assess the request body using JSON data', async function () {
      await browser.url('/postfetch.html');
      await browser.setupInterceptor();
      await completedRequest('#buttonjson');
      const request = await browser.getRequest(0);
      assert.equal(request.headers['content-type'], 'application/json');
      assert.deepEqual(request.body, { foo: 'bar' });
    });
  });

  describe('pending requests', function () {
    // Ensure we have waited for the requests to have completed before starting the next test.
    afterEach(async function () {
      await browser.pause(wait);
    });
    [
      { api: 'XHR', button: '#slow', fastButton: '#fast' },
      { api: 'Fetch', button: '#fetchslow', fastButton: '#fetchfast' },
    ].forEach(({ api, button, fastButton }) => {
      it(`can report pending ${api} requests`, async function () {
        await browser.url('/pending.html');
        await browser.setupInterceptor();
        await $(button).click();
        const request = await browser.getRequest(0, { includePending: true });
        assert.equal(request.method, 'POST');
        assert.match(request.url, /post\.json\?slow=true/);
        assert.equal(typeof request.response, 'undefined');
        assert.equal(request.pending, true);
      });

      it(`can indicate if ${api} requests are pending`, async function () {
        await browser.url('/pending.html');
        await browser.setupInterceptor();
        assert.equal(
          await browser.hasPendingRequests(),
          false,
          'should be false with no requests'
        );
        await $(button).click();
        assert.equal(
          await browser.hasPendingRequests(),
          true,
          'should be true after clicking'
        );
        await browser.pause(wait);
        assert.equal(
          await browser.hasPendingRequests(),
          false,
          'should be false after request completion'
        );
      });

      it(`can ignore pending ${api} requests`, async function () {
        await browser.url('/pending.html');
        await browser.setupInterceptor();
        // Initiate the slow request, then the fast request, and wait for the fast request to complete.
        await $(button)
          .click()
          .then(() => completedRequest(fastButton));
        const completedOnly = await browser.getRequests({
          includePending: false,
        });
        assert.equal(
          completedOnly.length,
          1,
          '"includePending: false" should ignore pending requests'
        );
        const request = completedOnly[0];
        assert.equal(
          request.pending,
          false,
          'should retrieve completed request only'
        );
        assert.notEqual(
          typeof request.response,
          'undefined',
          'should retrieve completed request'
        );
      });
    });

    it('orders pending requests at the end by default', async function () {
      await browser.url('/pending.html');
      await browser.setupInterceptor();
      await $('#slow')
        .click()
        .then(() => completedRequest('#fast'))
        .then(() => $('#fetchslow').click())
        .then(() => completedRequest('#fetchfast'));
      const requests = await browser.getRequests({ includePending: true });
      assert(Array.isArray(requests));
      assert.equal(requests.length, 4);
      assert.equal(
        requests[0].pending || requests[1].pending,
        false,
        '1st and 2nd requests should be completed'
      );
      assert.equal(
        requests[2].pending && requests[3].pending,
        true,
        '3rd & 4th requests should be pending'
      );
      // Default sort should be stable.
      assert.match(requests[0].url, /\?type=xhr/, 'fast XHR should come first');
      assert.match(
        requests[1].url,
        /\?type=fetch/,
        'fast Fetch should come 2nd'
      );
      assert.match(
        requests[2].url,
        /\?slow=true&type=xhr/,
        'slow XHR should be 3rd'
      );
      assert.match(
        requests[3].url,
        /\?slow=true&type=fetch/,
        'slow Fetch should be last'
      );
    });

    it('preserves click order when ordering by initiation time', async function () {
      await browser.url('/pending.html');
      await browser.setupInterceptor();
      await $('#slow')
        .click()
        .then(() => completedRequest('#fast'))
        .then(() => $('#fetchslow').click())
        .then(() => completedRequest('#fetchfast'));
      const requests = await browser.getRequests({
        includePending: true,
        orderBy: 'START',
      });
      assert(Array.isArray(requests));
      assert.equal(requests.length, 4);
      assert.equal(
        requests[0].pending && requests[2].pending,
        true,
        '1st & 3rd requests should be pending'
      );
      assert.equal(
        requests[1].pending || requests[3].pending,
        false,
        '2nd & 4th requests should be completed'
      );
      assert.match(
        requests[0].url,
        /\?slow=true&type=xhr/,
        'slow XHR should be 1st'
      );
      assert.match(requests[1].url, /\?type=xhr/, 'fast XHR should be 2nd');
      assert.match(
        requests[2].url,
        /\?slow=true&type=fetch/,
        'slow Fetch should be 3rd'
      );
      assert.match(
        requests[3].url,
        /\?type=fetch/,
        'fast Fetch should be last'
      );
    });

    it('cannot assert on pending requests', async function () {
      await browser.url('/pending.html');
      await browser.setupInterceptor();
      await browser.expectRequest('POST', /post\.json\?slow=true/, null);
      await $('#slow').click();
      await assert.rejects(() =>
        browser.assertRequests({ includePending: true })
      );
    });
  });
});
