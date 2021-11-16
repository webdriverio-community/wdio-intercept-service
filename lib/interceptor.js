'use strict';

var interceptor = {
  setup: function setup(done) {
    var NAMESPACE = '__webdriverajax';

    window[NAMESPACE] = { requests: [] };

    // Some browsers don't support FormData.entries(), so we polyfill that (sigh)
    if (typeof FormData.prototype.entries == 'undefined') {
      polyfillFormDataEntries();
    }

    if (window.sessionStorage && window.sessionStorage.removeItem) {
      window.sessionStorage.removeItem(NAMESPACE);
    }

    if (typeof window.fetch == 'function') {
      replaceFetch();
    }

    replaceXHR();

    done(window[NAMESPACE]);

    function replaceFetch() {
      var _fetch = window.fetch;
      window.fetch = function () {
        // Default values if not overwritten
        var request = {
          method: 'GET',
          requestHeaders: {},
          requestBody: undefined,
          url: '',
          headers: {},
        };
        var input = arguments[0];
        var init = arguments[1];
        if (typeof input == 'string') {
          request.url = input;
        } else if (input instanceof URL) {
          request.url = input.href;
        } else {
          if (input instanceof Request) {
            // Request object
            var clonedRequest = input.clone();
            request.requestBody = clonedRequest.text();
            request.url = clonedRequest.url;
            request.requestHeaders = parseHeaders(clonedRequest.headers);
            request.method = clonedRequest.method;
          } else {
            console.error('Unhandled input type to fetch API!');
            request.requestBody = input.body;
          }
        }
        if (init) {
          if (typeof init.body !== 'undefined') request.requestBody = init.body;
          if (typeof init.method !== 'undefined') request.method = init.method;
          request.requestHeaders = parseHeaders(init.headers);
        }

        return _fetch.apply(window, arguments).then(function (response) {
          // TODO: We could clone it multiple times and check for all type variations of body
          var clonedResponse = response.clone();
          var responsePromise = clonedResponse.text();

          Promise.all([request.requestBody, responsePromise]).then(function (
            results
          ) {
            request.requestBody = results[0];
            request.body = results[1];
            request.statusCode = clonedResponse.status;
            request.headers = parseHeaders(clonedResponse.headers);
            addRequest(request);
          });
          return response;
        });
      };
    }

    function replaceXHR() {
      var originalOpen = XMLHttpRequest.prototype.open;
      var originalSend = XMLHttpRequest.prototype.send;
      var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
      XMLHttpRequest.prototype.open = function () {
        this.lastMethod = arguments[0];
        this.lastURL = arguments[1];
        originalOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function () {
        this.lastRequestBody = parsePayload(arguments[0]);
        originalSend.apply(this, arguments);

        var _this = this;
        this.addEventListener('load', function () {
          var req = {
            url: _this.lastURL,
            method: _this.lastMethod.toUpperCase(),
            headers: _this.getAllResponseHeaders(),
            requestHeaders: _this.lastRequestHeader || {},
            statusCode: _this.status,
            requestBody: _this.lastRequestBody,
          };
          // The body may need to be further processed, or may be ready synchronously.
          var parsed = parseBody(_this, req);
          if (!parsed.deferred) {
            req.body = parsed.body;
            addRequest(req);
          }
        });
      };
      XMLHttpRequest.prototype.setRequestHeader = function () {
        if (!this.lastRequestHeader) {
          this.lastRequestHeader = {};
        }
        this.lastRequestHeader[arguments[0]] = arguments[1];
        originalSetRequestHeader.apply(this, arguments);
      };
    }

    function parseBody(xhr, request) {
      if (xhr.responseType === 'arraybuffer') {
        return {
          body: new TextDecoder().decode(xhr.response),
        };
      } else if (xhr.responseType === 'blob') {
        // Read the response like a file.
        var fr = new FileReader();
        fr.addEventListener('load', function () {
          request.body = new TextDecoder().decode(this.result);
          addRequest(request);
        });
        fr.readAsArrayBuffer(xhr.response);
        return { deferred: true };
      }
      // IE9 comp: need xhr.responseText
      return {
        body: xhr.response || xhr.responseText,
      };
    }

    function parseHeaders(headers) {
      if (headers instanceof Headers) {
        var result = {};

        var headersEntries = headers.entries();
        var header = headersEntries.next();
        while (!header.done) {
          result[header.value[0]] = header.value[1];
          header = headersEntries.next();
        }
        return result;
      }
      return headers || {};
    }

    function parsePayload(payload) {
      var parsed;
      if (typeof payload == 'string') {
        parsed = payload;
      } else if (payload instanceof FormData) {
        parsed = {};
        var entries = payload.entries();
        var item;
        while (((item = entries.next()), !item.done)) {
          parsed[item.value[0]] = item.value.slice(1);
        }
        parsed = JSON.stringify(parsed);
      } else if (payload instanceof ArrayBuffer) {
        parsed = String.fromCharCode.apply(null, payload);
      } else {
        // Just try to convert it to a string, whatever it might be
        try {
          parsed = JSON.stringify(payload);
        } catch (e) {
          parsed = '';
        }
      }
      return parsed;
    }

    function addRequest(request) {
      window[NAMESPACE].requests.push(request);
      pushToSessionStorage(request);
    }

    function pushToSessionStorage(req) {
      if (!window.sessionStorage || !window.sessionStorage.setItem) {
        return;
      }
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
      FormData.prototype.append = function () {
        this.__entries = this.__entries || [];
        this.__entries.push(Array.prototype.slice.call(arguments));
        originalAppend.apply(this, arguments);
      };
      FormData.prototype.entries = function () {
        return this.__entries;
      };
    }
  },
  getRequest: function getRequest(index) {
    var NAMESPACE = '__webdriverajax';

    var requests;

    if (window.sessionStorage && window.sessionStorage.getItem) {
      requests = getFromSessionStorage() || [];
    } else {
      requests = window[NAMESPACE].requests || [];
    }

    function getFromSessionStorage() {
      var rawData = window.sessionStorage.getItem(NAMESPACE);
      var parsed;
      if (rawData) {
        try {
          parsed = JSON.parse(rawData);
        } catch (e) {
          throw new Error('Could not parse sessionStorage data: ' + e.message);
        }
      }
      return parsed;
    }

    if (index == null) {
      return requests;
    }

    return requests[index];
  },
};

module.exports = interceptor;
