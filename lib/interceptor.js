'use strict';

var interceptor = {
    setup: function setup (done) {

        var NAMESPACE = '__webdriverajax';

        window[NAMESPACE] = { requests: [] };

        // Some browsers don't support FormData.entries(), so we polyfill that (sigh)
        if (typeof FormData.prototype.entries == 'undefined') {
            polyfillFormDataEntries();
        }

        var _XHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
            var xhr = new _XHR();
            var originalOpen = xhr.open;
            var originalSend = xhr.send;
            var originalSetRequestHeader = xhr.setRequestHeader;
            var lastMethod;
            var lastURL;
            var lastRequestBody;
            var lastRequestHeader = {};
            xhr.open = function () {
                lastMethod = arguments[0];
                lastURL = arguments[1];
                originalOpen.apply(xhr, arguments);
            };
            xhr.send = function () {
                var payload;
                if (typeof arguments[0] == 'string') {
                    payload = arguments[0];
                } else if (arguments[0] instanceof FormData) {
                    payload = {};
                    for (var entry of arguments[0].entries()) {
                        payload[entry[0]] = entry.slice(1);
                    }
                    payload = JSON.stringify(payload);
                } else if (arguments[0] instanceof ArrayBuffer) {
                    payload = String.fromCharCode.apply(null, arguments[0]);
                } else {
                    // Just try to convert it to a string, whatever it might be
                    try {
                        payload = JSON.stringify(arguments[0]);
                    } catch (e) {
                        payload = '';
                    }
                }
                lastRequestBody = payload;
                originalSend.apply(xhr, arguments);
            };
            xhr.setRequestHeader = function() {
                lastRequestHeader[arguments[0]] = arguments[1];
                originalSetRequestHeader.apply(xhr, arguments);
            };
            xhr.addEventListener('load', function () {
                var req = {
                    url: lastURL,
                    method: lastMethod.toUpperCase(),
                    headers: xhr.getAllResponseHeaders(),
                    requestHeaders: lastRequestHeader,
                    // IE9 comp: need xhr.responseText
                    body: xhr.response || xhr.responseText,
                    statusCode: xhr.status,
                    requestBody: lastRequestBody,
                };
                window[NAMESPACE].requests.push(req);
                if (window.sessionStorage && window.sessionStorage.setItem) {
                    pushToSessionStorage(req);
                }
            });
            return xhr;
        };

        done(window[NAMESPACE]);

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

        function polyfillFormDataEntries() {
            var originalAppend = FormData.prototype.append;
            FormData.prototype.append = function() {
                this.__entries = this.__entries || [];
                this.__entries.push(Array.prototype.slice.call(arguments));
                originalAppend.apply(this, arguments);
            };
            FormData.prototype.entries = function() {
                return this.__entries;
            };
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
