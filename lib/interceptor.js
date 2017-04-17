'use strict';

var interceptor = {
    setup: function setup () {

        var NAMESPACE = '__webdriverajax';

        window[NAMESPACE] = { requests: [] };

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
                var req = {
                    url: lastURL,
                    method: lastMethod.toUpperCase(),
                    headers: xhr.getAllResponseHeaders(),
                    // IE9 comp: need xhr.responseText
                    body: xhr.response || xhr.responseText,
                    statusCode: xhr.status
                };
                window[NAMESPACE].requests.push(req);
                if (window.sessionStorage && window.sessionStorage.setItem) {
                    pushToSessionStorage(req);
                }
            });
            return xhr;
        };

        function pushToSessionStorage (req) {
            var rawData = window.sessionStorage.getItem(NAMESPACE);
            var parsed;
            if (rawData) {
                try {
                    parsed = JSON.parse(rawData);
                } catch (e) {
                    throw new Error('Could not parse sessionStorage data: ' + e.message);
                }
            } else {
                parsed = [];
            }
            parsed.push(req);
            window.sessionStorage.setItem(NAMESPACE, JSON.stringify(parsed));
        }
    },
    getRequest: function getRequest (index) {

        var NAMESPACE = '__webdriverajax';

        var requests;

        if (window.sessionStorage && window.sessionStorage.getItem) {
            requests = getFromSessionStorage();
        } else {
            requests = window[NAMESPACE].requests;
        }

        function getFromSessionStorage () {
            var rawData = window.sessionStorage.getItem(NAMESPACE);
            var parsed;
            if (rawData) {
                try {
                    parsed = JSON.parse(rawData);
                } catch (e) {
                    throw new Error('Could not parse sessionStorage data: ' + e.message);
                }
            }
            window.sessionStorage.removeItem(NAMESPACE);
            return parsed;
        }

        if (index == null) {
            return requests;
        }

        return requests[index];

    }
};

module.exports = interceptor;
