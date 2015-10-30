'use strict';

var interceptor = {
    setup: function setup (config) {
        window.__webdriverajax = {
            config: config || {},
            expectations: [],
            requests: []
        };
        var _XHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
            var xhr = new _XHR();
            var originalOpen = xhr.open;
            var lastMethod;
            xhr.open = function () {
                lastMethod = arguments[0];
                originalOpen.apply(xhr, arguments);
            };
            xhr.addEventListener('load', function () {
                window.__webdriverajax.requests.push({
                    requestedMethod: lastMethod.toUpperCase(),
                    xhr: this
                });
            });
            return xhr;
        };
    },
    expectRequest: function expectRequest (expectedMethod, expectedURL, expectedStatus) {
        window.__webdriverajax.expectations.push({
            expectedMethod: expectedMethod.toUpperCase(),
            expectedURL: expectedURL,
            expectedStatus: expectedStatus
        });
    },
    getRequest: function getRequest (index) {

        function extractInfo (request) {
            if (!request || !request.xhr) {
                return;
            }
            return {
                url: request.xhr.responseURL,
                method: request.requestedMethod,
                headers: request.xhr.getAllResponseHeaders(),
                body: request.xhr.response,
                status: request.xhr.status
            };
        }

        if (index == null) {
            return window.__webdriverajax.requests.map(extractInfo);
        }

        return extractInfo(window.__webdriverajax.requests[index]);

    },
    assertRequests: function assertRequests () {
        window.__webdriverajax.expectations.forEach(function (ex, idx) {

            function toRegex (str) {
                var match = str && str.match(/^\/(.+)\/([gim]*)$/);
                return match && new RegExp(match[1], match[2]);
            }

            var request = window.__webdriverajax.requests[idx];
            if (window.__webdriverajax.expectations.length !== window.__webdriverajax.requests.length) {
                throw new Error(
                    'Expected ' +
                    window.__webdriverajax.expectations.length +
                    ' requests but was ' +
                    window.__webdriverajax.requests.length
                );
            }
            if (request.requestedMethod !== ex.expectedMethod) {
                throw new Error(
                    'Expected request to URL ' +
                    request.xhr.responseURL +
                    ' to have method ' +
                    ex.expectedMethod +
                    ' but was ' + request.requestedMethod
                );
            }
            if (ex.expectedURL.regex) {
                var regex = toRegex(ex.expectedURL.regex);
                if (request.xhr.responseURL && !request.xhr.responseURL.match(regex)) {
                    throw new Error(
                        'Expected request ' +
                        idx +
                        ' to match '
                        + regex.toString() +
                        ' but was ' +
                        request.xhr.responseURL
                    );
                }
            } else if (request.xhr.responseURL !== ex.expectedURL) {
                throw new Error(
                    'Expected request ' +
                    idx +
                    ' to have URL '
                    + ex.expectedURL +
                    ' but was ' +
                    request.xhr.responseURL
                );
            }
            if (request.xhr.status !== ex.expectedStatus) {
                throw new Error(
                    'Expected request to URL ' +
                    request.xhr.responseURL +
                    ' to have status ' +
                    ex.expectedStatus +
                    ' but was ' +
                    request.xhr.status
                );
            }
        });
    }
};

module.exports = interceptor;
