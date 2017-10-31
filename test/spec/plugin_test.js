'use strict';

var assert = require('assert');

describe('webdriverajax', function () {

    this.timeout(process.env.CI ? 100000 : 10000);

    it('sets up the interceptor', function () {
        assert.equal(typeof browser.setupInterceptor, 'function');
        browser.url('/get.html');
        browser.setupInterceptor();
        var ret = browser.execute(function checkSetup () {
            return window.__webdriverajax;
        });
        assert.deepEqual(ret.value, { requests: [] });
    });

    it('can intercept a simple GET request', function () {
        browser.url('/get.html').setupInterceptor();
        browser.expectRequest('GET', '/get.json', 200);
        browser.click('#button').pause(1000);
        browser.assertRequests();
    });

    it('can use regular expressions for urls', function () {
        browser.url('/get.html').setupInterceptor();
        browser.expectRequest('GET', /get\.json/, 200);
        browser.click('#button').pause(1000);
        browser.assertRequests();
    });

    it('errors on wrong request count', function () {
        browser.url('/get.html').setupInterceptor();
        browser
            .expectRequest('GET', '/get.json', 200)
            .expectRequest('GET', '/get.json', 200);
        browser.click('#button').pause(1000);
        assert.throws(function () {
            browser.assertRequests();
        }, /Expected/);
    });

    it('errors on wrong method', function () {
        browser.url('/get.html').setupInterceptor();
        browser.expectRequest('PUT', '/get.json', 200);
        browser.click('#button').pause(1000);
        assert.throws(function () {
            browser.assertRequests();
        }, /PUT/);
    });

    it('errors on wrong URL', function () {
        browser.url('/get.html').setupInterceptor();
        browser.expectRequest('GET', '/wrong.json', 200);
        browser.click('#button').pause(1000);
        assert.throws(function () {
            browser.assertRequests();
        }, /wrong\.json/);
    });

    it('errors if regex doesn\'t match URL', function () {
        browser.url('/get.html').setupInterceptor();
        browser.expectRequest('GET', /wrong\.json/, 200);
        browser.click('#button').pause(1000);
        assert.throws(function () {
            browser.assertRequests();
        }, /get\.json/);

    });

    it('errors on wrong status code', function () {
        browser.url('/get.html').setupInterceptor();
        browser.expectRequest('GET', '/get.json', 404);
        browser.click('#button').pause(1000);
        assert.throws(function () {
            browser.assertRequests();
        }, /404/);
    });

    it('can access a certain request', function () {
        browser.url('/get.html').setupInterceptor();
        browser.click('#button').pause(1000);
        var request = browser.getRequest(0);
        assert.equal(request.method, 'GET');
        assert.equal(request.url, '/get.json');
        assert.deepEqual(request.response.body, { OK: true });
        assert.equal(request.response.statusCode, 200);
        assert.equal(request.response.headers['content-length'], '15');
    });

    it('can get multiple requests', function () {
        browser.url('/get.html').setupInterceptor();
        browser.click('#button').pause(1000);
        browser.click('#button').pause(1000);
        var requests = browser.getRequests();
        assert(Array.isArray(requests));
        assert.equal(requests.length, 2);
        assert.equal(requests[0].method, 'GET');
        assert.equal(requests[1].method, 'GET');
    });

    it('survives page changes', function () {
        browser.url('/page_change.html').setupInterceptor();
        browser.click('#button1').pause(2000);
        var requests = browser.getRequests();
        assert(Array.isArray(requests));
        assert.equal(requests.length, 1);
        assert.equal(requests[0].method, 'GET');
    });

    it('survives page changes using multiple requests', function () {
        browser.url('/page_change.html').setupInterceptor();
        browser.click('#button1').click('#button2').pause(2000);
        var requests = browser.getRequests();
        assert(Array.isArray(requests));
        assert.equal(requests.length, 2);
        assert.equal(requests[0].method, 'GET');
        assert.equal(requests[1].method, 'GET');
    });
});
