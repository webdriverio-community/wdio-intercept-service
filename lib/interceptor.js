'use strict';

var interceptor = {
  disableInterceptor: function disableInterceptor(done) {
    var NAMESPACE = '__webdriverajax';
    if (window[NAMESPACE] != undefined) {
      window[NAMESPACE].interceptorDisabled = true;
    }
    done(window[NAMESPACE]);
  },

  excludeUrls: function excludeUrls(urls, done) {
    var NAMESPACE = '__webdriverajax';
    if (window[NAMESPACE] != undefined) {
      // Convert the strings to regular expressions once.
      var exprs = urls.map(function (obj) {
        return new RegExp(obj.source, obj.flags);
      });
      Array.prototype.push.apply(window[NAMESPACE].excludedUrls, exprs);
    }
    done(window[NAMESPACE]);
  },

  setup: function setup(done) {
    var NAMESPACE = '__webdriverajax';
    var PKG_PREFIX = '[wdio-intercept-service]: ';

    window[NAMESPACE] = {
      interceptorDisabled: false,
      excludedUrls: [],
      requests: [],
    };

    // Some browsers don't support FormData.entries(), so we polyfill that (sigh)
    if (typeof FormData.prototype.entries == 'undefined') {
      polyfillFormDataEntries();
    }

    if (supportsSessionStorage()) {
      window.sessionStorage.removeItem(NAMESPACE);
    }

    if (typeof window.fetch == 'function') {
      replaceFetch();
      if (
        typeof window.Promise === 'undefined' ||
        typeof window.Promise.all !== 'function'
      ) {
        console.error(PKG_PREFIX + 'Fetch API preconditions not met!');
      }
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
            console.error(PKG_PREFIX + 'Unhandled input type to fetch API!');
            request.requestBody = input.body;
          }
        }
        if (init) {
          if (typeof init.body !== 'undefined')
            request.requestBody = parsePayload(init.body);
          if (typeof init.method !== 'undefined') request.method = init.method;
          request.requestHeaders = parseHeaders(init.headers);
        }
        addPendingRequest(request);

        return _fetch.apply(window, arguments).then(function (response) {
          // TODO: We could clone it multiple times and check for all type variations of body
          var clonedResponse = response.clone();
          var responsePromise = clonedResponse.text();

          // After decoding the request's body (which may have come from Request#text())
          // and the response body, we can store the completed request.
          Promise.all([request.requestBody, responsePromise]).then(function (
            results
          ) {
            completeFetchRequest(request, {
              requestBody: results[0],
              body: results[1],
              statusCode: clonedResponse.status,
              headers: parseHeaders(clonedResponse.headers),
            });
          });

          // Forward the original response to the application on the current tick.
          return response;
        });
      };
    }

    function replaceXHR() {
      var originalOpen = XMLHttpRequest.prototype.open;
      var originalSend = XMLHttpRequest.prototype.send;
      var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
      var originalAbort = XMLHttpRequest.prototype.abort;
      var handleDoneRequest = function (xhr) {
        if (xhr.readyState == XMLHttpRequest.prototype.DONE) {
          var req = xhr.lastReq;
          req.statusCode = xhr.status;
          req.headers = xhr.getAllResponseHeaders();
          // The body may need to be further processed, or may be ready synchronously.
          var parsed = parseBody(xhr, req);
          if (!parsed.deferred) {
            completeXHRRequest(req, parsed.body);
          }
        }
      };
      XMLHttpRequest.prototype.open = function () {
        this.lastMethod = arguments[0];
        this.lastURL = arguments[1];
        originalOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function () {
        this.lastReq = {
          method: this.lastMethod.toUpperCase(),
          requestHeaders: this.lastRequestHeader || {},
          requestBody: parsePayload(arguments[0]),
          url: this.lastURL.toString(),
        };
        addPendingRequest(this.lastReq);
        originalSend.apply(this, arguments);

        var _this = this;
        this.addEventListener('load', function () {
          handleDoneRequest(_this);
        });
      };
      XMLHttpRequest.prototype.setRequestHeader = function () {
        if (!this.lastRequestHeader) {
          this.lastRequestHeader = {};
        }
        this.lastRequestHeader[arguments[0]] = arguments[1];
        originalSetRequestHeader.apply(this, arguments);
      };
      XMLHttpRequest.prototype.abort = function () {
        handleDoneRequest(this);
        originalAbort.apply(this, arguments);
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
          completeXHRRequest(request, new TextDecoder().decode(this.result));
        });
        fr.readAsArrayBuffer(xhr.response);
        return { deferred: true };
      }
      // IE9 comp: need xhr.responseText
      return {
        body: xhr.response || xhr.responseText,
      };
    }

    // Change every type of response header objects to raw text
    function parseHeaders(headers) {
      if (headers instanceof Headers) {
        // IE compatibility can be ignored here, because
        // the Headers object is only available in modern browsers.
        // Also no new keywords are used, so IE won't panic upon parsing the script.
        return Array.from(headers.entries())
          .map(function (x) {
            return x.join(': ');
          })
          .join('\r\n');
      }
      return headers || '';
    }

    /**
     * Stringify the given XHR payload so it can be parsed as JSON
     * @param {*} payload XHR request body that is sent to the remote server.
     * @returns {string} JSON-parsable representation of the request body
     */
    function parsePayload(payload) {
      if (typeof payload == 'string') {
        return payload;
      }
      if (payload instanceof FormData) {
        var parsed = {};
        var entries = payload.entries();
        var item;
        while (((item = entries.next()), !item.done)) {
          parsed[item.value[0]] = item.value.slice(1);
        }
        return JSON.stringify(parsed);
      }
      if (payload instanceof ArrayBuffer) {
        return String.fromCharCode.apply(null, payload);
      }
      if (payload instanceof URLSearchParams) {
        return payload.toString();
      }

      // Just try to convert it to a string, whatever it might be
      try {
        return JSON.stringify(payload);
      } catch (e) {
        console.error(PKG_PREFIX + 'Failed to stringify payload as JSON!', e);
      }
      return '';
    }

    function addPendingRequest(startedRequest) {
      startedRequest.__processed = Date.now();
      window[NAMESPACE].requests.push(startedRequest);
      pushToSessionStorage(startedRequest);
    }

    function completeFetchRequest(startedRequest, completedRequest) {
      // Merge the completed data with the started request.
      startedRequest.requestBody = completedRequest.requestBody;
      startedRequest.body = completedRequest.body;
      startedRequest.headers = completedRequest.headers;
      startedRequest.statusCode = completedRequest.statusCode;
      startedRequest.__fulfilled = Date.now();
      replaceInSessionStorage(startedRequest);
    }

    function completeXHRRequest(startedRequest, responseBody) {
      // Merge the completed data with the started request.
      startedRequest.body = responseBody;
      startedRequest.__fulfilled = Date.now();
      replaceInSessionStorage(startedRequest);
    }

    function getParsedSessionStorage() {
      var rawData = window.sessionStorage.getItem(NAMESPACE);
      if (!rawData) {
        return [];
      }
      try {
        return JSON.parse(rawData);
      } catch (e) {
        throw new Error(
          PKG_PREFIX + 'Could not parse sessionStorage data: ' + e.message
        );
      }
    }

    function supportsSessionStorage() {
      return (
        typeof window.sessionStorage === 'object' &&
        window.sessionStorage !== null &&
        typeof window.sessionStorage.setItem === 'function' &&
        typeof window.sessionStorage.removeItem === 'function'
      );
    }

    function shouldExcludeRequestByUrl(url) {
      return window[NAMESPACE].excludedUrls.some(function (regex) {
        return regex.test(url);
      });
    }

    function pushToSessionStorage(req) {
      if (window[NAMESPACE].interceptorDisabled == true) {
        return;
      }
      if (!supportsSessionStorage()) {
        return;
      }
      if (shouldExcludeRequestByUrl(req.url)) {
        return;
      }
      var parsed = getParsedSessionStorage();
      parsed.push(req);
      window.sessionStorage.setItem(NAMESPACE, JSON.stringify(parsed));
    }

    function replaceInSessionStorage(completedRequest) {
      if (window[NAMESPACE].interceptorDisabled == true) {
        return;
      }
      if (!supportsSessionStorage()) {
        return;
      }
      var parsed = getParsedSessionStorage();
      // Unlike requests held in the namespace, no session-stored requests can share object equality
      // with the completed request, due to the string serialization. Instead, we must look for an
      // item with the same "__processed" time. In case multiple requests are added simultaneously,
      // the url and method are used to further disambiguate the serialized requests.
      for (
        var storedRqNumber = 0;
        storedRqNumber < parsed.length;
        ++storedRqNumber
      ) {
        var r = parsed[storedRqNumber];
        if (
          r.__processed === completedRequest.__processed &&
          r.url === completedRequest.url &&
          r.method === completedRequest.method
        ) {
          parsed[storedRqNumber] = completedRequest;
          break;
        }
      }
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
  getRequest: function getRequest(index, options) {
    var NAMESPACE = '__webdriverajax';
    var PKG_PREFIX = '[wdio-intercept-service]: ';

    function getFromSessionStorage() {
      var rawData = window.sessionStorage.getItem(NAMESPACE);
      var parsed;
      if (rawData) {
        try {
          parsed = JSON.parse(rawData);
        } catch (e) {
          throw new Error(
            PKG_PREFIX + 'Could not parse sessionStorage data: ' + e.message
          );
        }
      }
      return parsed;
    }
    function getAllRequests() {
      // Session storage will always return an array that can be mutated freely.
      if (window.sessionStorage && window.sessionStorage.getItem) {
        return getFromSessionStorage() || [];
      }
      // But if we have to use the active namespace array, then return a copy of it.
      var shouldClone = window[NAMESPACE].requests;
      return shouldClone ? shouldClone.slice() : [];
    }
    function isComplete(r) {
      return typeof r.__fulfilled === 'number';
    }

    var requests = getAllRequests();

    var shouldSortByEnd = String(options.orderBy).toUpperCase() !== 'START';
    if (shouldSortByEnd) {
      // Sort ascending by time of fulfillment. If not fulfilled yet, sort to the end!
      requests.sort(function (a, b) {
        var hasA = isComplete(a);
        var hasB = isComplete(b);
        if (hasA && hasB) return a.__fulfilled - b.__fulfilled;
        if (hasA) return -1; // Only A is fulfilled, so order A before B
        if (hasB) return 1; // Only B is fulfilled, so order A after B
        return 0; // Preserve ordering of A & B.
      });
    }

    var includePending = Boolean(options.includePending);
    if (index == null) {
      return includePending ? requests : requests.filter(isComplete);
    }

    if (!includePending) {
      // Filter out the pending requests and index only into the completed requests.
      return requests.filter(isComplete)[index];
    }
    return requests[index];
  },

  /**
   * Convenience method that avoids needing to marshall all requests between node & the browser,
   * and instead inspects the active namespace request array for any unfulfilled requests.
   */
  hasPending: function hasPending() {
    var NAMESPACE = '__webdriverajax';
    var allRequests = window[NAMESPACE].requests || [];
    for (var idx = 0; idx < allRequests.length; ++idx) {
      if (typeof allRequests[idx].__fulfilled === 'undefined') return true;
    }
    return false;
  },
};

module.exports = interceptor;
