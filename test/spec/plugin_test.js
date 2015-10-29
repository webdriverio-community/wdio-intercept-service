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

    it('can access a certain response', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .click('#button')
            .pause(1000)
            .getResponse(0)
            .then(function (response) {
                assert.equal(response.method, 'GET');
                assert.deepEqual(response.body, { OK: true });
                assert.equal(response.url, 'http://localhost:8080/simple_get.json');
                assert.equal(response.status, 200);
                assert.equal(response.headers['content-length'], '15');
            });

    });

});
