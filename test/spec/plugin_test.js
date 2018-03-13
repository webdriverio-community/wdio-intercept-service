'use strict';

const assert = require('assert');

describe('webdriverajax', function testSuite() {
  this.timeout(process.env.CI ? 100000 : 10000);

  const wait = process.env.CI ? 10000 : 1000;

  it('sets up the interceptor', () => {
    assert.equal(typeof browser.setupInterceptor, 'function');
    browser.url('/get.html');
    browser.setupInterceptor();
    const ret = browser.execute(() => {
      return window.__webdriverajax;
    });
    assert.deepEqual(ret.value, { requests: [] });
  });

  it('can intercept a simple GET request', () => {
    browser.url('/get.html').setupInterceptor();
    browser.expectRequest('GET', '/get.json', 200);
    browser.click('#button').pause(wait);
    browser.assertRequests();
  });

  it('can use regular expressions for urls', () => {
    browser.url('/get.html').setupInterceptor();
    browser.expectRequest('GET', /get\.json/, 200);
    browser.click('#button').pause(wait);
    browser.assertRequests();
  });

  it('errors on wrong request count', () => {
    browser.url('/get.html').setupInterceptor();
    browser
      .expectRequest('GET', '/get.json', 200)
      .expectRequest('GET', '/get.json', 200);
    browser.click('#button').pause(wait);
    assert.throws(() => {
      browser.assertRequests();
    }, /Expected/);
  });

  it('errors on wrong method', () => {
    browser.url('/get.html').setupInterceptor();
    browser.expectRequest('PUT', '/get.json', 200);
    browser.click('#button').pause(wait);
    assert.throws(() => {
      browser.assertRequests();
    }, /PUT/);
  });

  it('errors on wrong URL', () => {
    browser.url('/get.html').setupInterceptor();
    browser.expectRequest('GET', '/wrong.json', 200);
    browser.click('#button').pause(wait);
    assert.throws(() => {
      browser.assertRequests();
    }, /wrong\.json/);
  });

  it("errors if regex doesn't match URL", () => {
    browser.url('/get.html').setupInterceptor();
    browser.expectRequest('GET', /wrong\.json/, 200);
    browser.click('#button').pause(wait);
    assert.throws(() => {
      browser.assertRequests();
    }, /get\.json/);
  });

  it('errors on wrong status code', () => {
    browser.url('/get.html').setupInterceptor();
    browser.expectRequest('GET', '/get.json', 404);
    browser.click('#button').pause(wait);
    assert.throws(() => {
      browser.assertRequests();
    }, /404/);
  });

  it('can access a certain request', () => {
    browser.url('/get.html').setupInterceptor();
    browser.click('#button').pause(wait);
    const request = browser.getRequest(0);
    assert.equal(request.method, 'GET');
    assert.equal(request.url, '/get.json');
    assert.deepEqual(request.response.body, { OK: true });
    assert.equal(request.response.statusCode, 200);
    assert.equal(request.response.headers['content-length'], '15');
  });

  it('can get multiple requests', () => {
    browser.url('/get.html').setupInterceptor();
    browser.click('#button').pause(wait);
    browser.click('#button').pause(wait);
    const requests = browser.getRequests();
    assert(Array.isArray(requests));
    assert.equal(requests.length, 2);
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[1].method, 'GET');
  });

  it('survives page changes', () => {
    browser.url('/page_change.html').setupInterceptor();
    browser.click('#button1').pause(wait);
    const requests = browser.getRequests();
    assert(Array.isArray(requests));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'GET');
  });

  it('survives page changes using multiple requests', () => {
    browser.url('/page_change.html').setupInterceptor();
    browser
      .click('#button1')
      .click('#button2')
      .pause(wait);
    const requests = browser.getRequests();
    assert(Array.isArray(requests));
    assert.equal(requests.length, 2);
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[1].method, 'GET');
  });

  it('can assess the request body using string data', () => {
    browser.url('/post.html').setupInterceptor();
    browser.click('#buttonstring').pause(wait);
    const request = browser.getRequest(0);
    assert.equal(request.body, 'foobar');
  });

  it('can assess the request body using JSON data', () => {
    browser.url('/post.html').setupInterceptor();
    browser.click('#buttonjson').pause(wait);
    const request = browser.getRequest(0);
    assert.deepEqual(request.body, { foo: 'bar' });
  });

  it('can assess the request body using form data', () => {
    browser.url('/post.html').setupInterceptor();
    browser.click('#buttonform').pause(wait);
    const request = browser.getRequest(0);
    assert.deepEqual(request.body, { foo: ['bar'] });
  });

  it('can assess the request body using JSON data', () => {
    browser.url('/post.html').setupInterceptor();
    browser.click('#buttonjson').pause(wait);
    const request = browser.getRequest(0);
    assert.equal(request.headers['content-type'], 'application/json');
  });

  it('can get initialised inside an iframe', () => {
    browser.url('/frame.html').setupInterceptor();
    const ret = browser.execute(function checkSetup() {
      return window.__webdriverajax;
    });
    assert.deepEqual(ret.value, { requests: [] });
    browser.waitForExist('#getinframe');
    const frame = browser.element('#getinframe');
    browser.frame(frame.value);
    browser.setupInterceptor();
    const frameRet = browser.execute(function checkSetup() {
      return window.__webdriverajax;
    });
    assert.deepEqual(frameRet.value, { requests: [] });
    browser.expectRequest('GET', '/get.json', 200);
    browser.click('#button').pause(wait);
    browser.assertRequests();
    browser.frameParent();
    assert.throws(() => {
      browser.assertRequests();
    });
  });

  it('errors with no requests set up', () => {
    browser.url('/get.html').setupInterceptor();
    assert.throws(() => {
      browser.assertRequests();
    }, /No\sexpectations\sfound/);
  });

  it('returns an empty array for no captured requests', () => {
    browser.url('/get.html').setupInterceptor();
    const count = browser.getRequests();
    assert.deepEqual(count, []);
  });
});
