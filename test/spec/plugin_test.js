'use strict';

var assert = require('assert');

describe('webdriverajax', function () {

    it('sets up the interceptor', function () {

        assert.equal(typeof browser.setupInterceptor, 'function');

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .execute(function checkSetup () {
                return window.__webdriverajax;
            }).then(function (ret) {
                assert.deepEqual(ret.value, { requests: [] });
            });

    });

    it('can intercept a simple GET request', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('GET', '/simple_get.json', 200)
            .click('#button')
            .pause(1000)
            .assertRequests();

    });

    it('can use regular expressions for urls', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('GET', /simple_get\.json/, 200)
            .click('#button')
            .pause(1000)
            .assertRequests();

    });

    it('errors on wrong request count', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('GET', '/simple_get.json', 200)
            .expectRequest('GET', '/simple_get.json', 200)
            .click('#button')
            .pause(1000)
            .assertRequests().then(function () {
                throw new Error('This should not be called');
            }, function (err) {
                assert(err, 'should be rejected');
            });

    });

    it('errors on wrong method', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('PUT', '/simple_get.json', 200)
            .click('#button')
            .pause(1000)
            .assertRequests().then(function () {
                throw new Error('This should not be called');
            }, function (err) {
                assert(err, 'should be rejected');
            });

    });

    it('errors on wrong URL', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('GET', '/wrong.json', 200)
            .click('#button')
            .pause(1000)
            .assertRequests().then(function () {
                throw new Error('This should not be called');
            }, function (err) {
                assert(err, 'should be rejected');
            });

    });

    it('errors if regex doesn\'t match URL', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('GET', /wrong\.json/, 200)
            .click('#button')
            .pause(1000)
            .assertRequests().then(function () {
                throw new Error('This should not be called');
            }, function (err) {
                assert(err, 'should be rejected');
            });

    });

    it('errors on wrong status code', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .expectRequest('GET', '/simple_get.json', 404)
            .click('#button')
            .pause(1000)
            .assertRequests().then(function () {
                throw new Error('This should not be called');
            }, function (err) {
                assert(err, 'should be rejected');
            });

    });

    it('can access a certain request', function () {

        return browser.url('/simple_get.html')
            .setupInterceptor()
            .click('#button')
            .pause(1000)
            .getRequest(0)
            .then(function (request) {
                assert.equal(request.method, 'GET');
                assert.equal(request.url, '/simple_get.json');
                assert.deepEqual(request.response.body, { OK: true });
                assert.equal(request.response.statusCode, 200);
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
