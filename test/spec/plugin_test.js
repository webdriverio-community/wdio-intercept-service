'use strict';

var assert = require('assert');

describe('webdriverajax', function () {

    it('sets up the interceptor', function () {

        assert.equal(typeof browser.setupInterceptor, 'function');

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .execute(function checkSetup () {
                if (typeof window.__webdriverajax != 'object') {
                    throw new Error('WebdriverAjax was not setup properly');
                }
            });

    });

    it('can intercept a simple GET request', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('get', 'http://localhost:8080/simple_get.json', 200)
            .click('#button')
            .pause(1000)
            .assertRequests();

    });

    it('can use regular expressions for urls', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('get', /simple_get\.json/, 200)
            .click('#button')
            .pause(1000)
            .assertRequests();

    });

    it('can access a certain request', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .click('#button')
            .pause(1000)
            .getRequest(0)
            .then(function (request) {
                assert.equal(request.method, 'GET');
                assert.equal(request.url, 'http://localhost:8080/simple_get.json');
                assert.deepEqual(request.response.body, { OK: true });
                assert.equal(request.response.status, 200);
                assert.equal(request.response.headers['content-length'], '15');
            });

    });

    it('can get multiple requests', function () {
        return browser.url('/simple_get.html')
            .setupInterceptor()
            .click('#button')
            .pause(1000)
            .click('#button')
            .pause(1000)
            .getRequests()
            .then(function (requests) {
                assert(Array.isArray(requests));
                assert.equal(requests.length, 2);
                assert.equal(requests[0].method, 'GET');
                assert.equal(requests[1].method, 'GET');
            });
    });

});
