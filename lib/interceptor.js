'use strict';

var interceptor = {
    setup: function setup () {
        window.__webdriverajax = {
            requests: []
        };
        var _XHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
            var xhr = new _XHR();
            var originalOpen = xhr.open;
            var lastMethod;
            var lastURL;
            xhr.open = function () {
                lastMethod = arguments[0];
                lastURL = arguments[1];
                originalOpen.apply(xhr, arguments);
            };
            xhr.addEventListener('load', function () {
                window.__webdriverajax.requests.push({
                    requestedMethod: lastMethod.toUpperCase(),
                    requestedURL: lastURL,
                    xhr: this
                });
            });
            return xhr;
        };
    },
    getRequest: function getRequest (index) {

        if (index == null) {
            return window.__webdriverajax.requests.map(extractInfo);
        }

        return extractInfo(window.__webdriverajax.requests[index]);

        function extractInfo (request) {
            if (!request || !request.xhr) {
                return;
            }
            return {
                url: request.requestedURL,
                method: request.requestedMethod,
                headers: request.xhr.getAllResponseHeaders(),
                body: request.xhr.response,
                statusCode: request.xhr.status
            };
        }

    }
};

module.exports = interceptor;
