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
    getResponse: function (idx) {

        function parseHeaders (str) {
            var headers = {};
            var arr = str.trim().replace(/\r/g, '').split('\n');
            arr.forEach(function (header) {
                var match = header.match(/^(.+)?\:\s?(.+)$/);
                if (match) {
                    headers[match[1].toLowerCase()] = match[2];
                }
            });
            return headers;
        }

        function parseBody (str) {
            var body;
            try {
                body = JSON.parse(str);
            } catch(e) {
                body = str;
            }
            return body;
        }

        var request = window.__webdriverajax.requests[idx];

        if (request && request.xhr) {
            return {
                headers: parseHeaders(request.xhr.getAllResponseHeaders()),
                body: parseBody(request.xhr.response),
                status: request.xhr.status,
                url: request.xhr.responseURL,
                method: request.requestedMethod
            };
        } else {
            throw new Error('Could not find response ' + idx);
        }
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
