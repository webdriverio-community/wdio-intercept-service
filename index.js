'use strict';

const interceptor = require('./lib/interceptor');
const PKG_PREFIX = '[wdio-intercept-service]: ';
class InterceptServiceError extends Error {
  constructor(message, ...args) {
    super(PKG_PREFIX + message, ...args);
  }
}

const issueDeprecation = (map, key, what) => {
  if (!map[key]) {
    console.warn(
      `${PKG_PREFIX}${what} is deprecated and will no longer work in v5`
    );
    map[key] = true;
  }
};

class WebdriverAjax {
  constructor() {
    this._wdajaxExpectations = null;
    this._deprecations = {};
  }

  beforeTest() {
    this._wdajaxExpectations = [];
  }

  beforeScenario() {
    this._wdajaxExpectations = [];
  }

  before(_, __, browser) {
    /**
     * instance need to have addCommand method
     */
    if (typeof browser.addCommand !== 'function') {
      throw new Error(
        "you can't use WebdriverAjax with this version of WebdriverIO"
      );
    }

    browser.addCommand('setupInterceptor', setup.bind(this));
    browser.addCommand('disableInterceptor', disableInterceptor.bind(this));
    browser.addCommand('excludeUrls', excludeUrls.bind(this));
    browser.addCommand('getExpectations', getExpectations.bind(this));
    browser.addCommand('resetExpectations', resetExpectations.bind(this));
    browser.addCommand('expectRequest', expectRequest.bind(this));
    browser.addCommand('assertRequests', assertRequests.bind(this));
    browser.addCommand(
      'assertExpectedRequestsOnly',
      assertExpectedRequestsOnly.bind(this)
    );
    browser.addCommand('hasPendingRequests', hasPendingRequests);
    browser.addCommand('getRequest', getRequest);
    browser.addCommand('getRequests', getRequests);

    function disableInterceptor() {
      return browser.executeAsync(interceptor.disableInterceptor);
    }

    function excludeUrls(urls) {
      urls = urls.map(function (regex) {
        return typeof regex === 'object'
          ? { source: regex.source, flags: regex.flags }
          : { source: regex, flags: undefined };
      });
      return browser.executeAsync(interceptor.excludeUrls, urls);
    }

    function setup() {
      return browser.executeAsync(interceptor.setup);
    }

    function expectRequest(method, url, statusCode) {
      this._wdajaxExpectations.push({
        method: method.toUpperCase(),
        url: url,
        statusCode: statusCode,
      });
      return browser;
    }

    function assertRequests(options = {}) {
      const expectations = this._wdajaxExpectations;

      if (!expectations.length) {
        return Promise.reject(
          new Error('No expectations found. Call .expectRequest() first')
        );
      }

      // Don't let users request pending requests:
      if (options.includePending) {
        throw new InterceptServiceError(
          'passing `includePending` option to `assertRequests` is not supported!'
        );
      }
      return getRequests(options).then((requests) => {
        if (expectations.length !== requests.length) {
          return Promise.reject(
            new Error(
              'Expected ' +
                expectations.length +
                ' requests but was ' +
                requests.length
            )
          );
        }

        for (let i = 0; i < expectations.length; i++) {
          const ex = expectations[i];
          const request = requests[i];

          if (request.method !== ex.method) {
            return Promise.reject(
              new Error(
                'Expected request to URL ' +
                  request.url +
                  ' to have method ' +
                  ex.method +
                  ' but was ' +
                  request.method
              )
            );
          }

          if (
            ex.url instanceof RegExp &&
            request.url &&
            !request.url.match(ex.url)
          ) {
            return Promise.reject(
              new Error(
                'Expected request ' +
                  i +
                  ' to match ' +
                  ex.url.toString() +
                  ' but was ' +
                  request.url
              )
            );
          }

          if (typeof ex.url == 'string' && request.url !== ex.url) {
            return Promise.reject(
              new Error(
                'Expected request ' +
                  i +
                  ' to have URL ' +
                  ex.url +
                  ' but was ' +
                  request.url
              )
            );
          }

          if (request.response.statusCode !== ex.statusCode) {
            return Promise.reject(
              new Error(
                'Expected request to URL ' +
                  request.url +
                  ' to have status ' +
                  ex.statusCode +
                  ' but was ' +
                  request.response.statusCode
              )
            );
          }
        }

        return browser;
      });
    }

    function assertExpectedRequestsOnly(orderOrOptions) {
      const expectations = this._wdajaxExpectations;
      let inOrder = true;
      let options = {};
      if (typeof orderOrOptions === 'boolean') {
        issueDeprecation(
          this._deprecations,
          'inOrder',
          'Calling `assertExpectedRequestsOnly` with a boolean parameter'
        );
        inOrder = orderOrOptions;
      } else if (orderOrOptions && typeof orderOrOptions === 'object') {
        options = orderOrOptions;
        inOrder = 'inOrder' in orderOrOptions ? orderOrOptions.inOrder : true;
        delete options.inOrder;
      }

      // Don't let users request pending requests:
      if (options.includePending) {
        throw new InterceptServiceError(
          'passing `includePending` option to `assertExpectedRequestsOnly` is not supported!'
        );
      }
      return getRequests(options).then((requests) => {
        const clonedRequests = requests.slice();

        const matchedRequestIndexes = [];
        for (let i = 0; i < expectations.length; i++) {
          const ex = expectations[i];

          const matchingRequestIndex = clonedRequests.findIndex((request) => {
            if (
              !request ||
              request.method !== ex.method ||
              (ex.url instanceof RegExp &&
                request.url &&
                !request.url.match(ex.url)) ||
              (typeof ex.url == 'string' && request.url !== ex.url) ||
              request.response.statusCode !== ex.statusCode
            ) {
              return false;
            }

            return true;
          });

          if (matchingRequestIndex !== -1) {
            matchedRequestIndexes.push(matchingRequestIndex);
            delete clonedRequests[matchingRequestIndex];
          } else {
            return Promise.reject(
              new Error(
                'Expected request was not found. ' +
                  'method: ' +
                  ex.method +
                  ' url: ' +
                  ex.url +
                  ' statusCode: ' +
                  ex.statusCode
              )
            );
          }
        }

        if (matchedRequestIndexes.length !== expectations.length) {
          return Promise.reject(
            new Error(
              'Expected ' +
                expectations.length +
                ' requests but found ' +
                matchedRequestIndexes.length +
                ' matching requests'
            )
          );
        } else if (
          inOrder &&
          JSON.stringify(matchedRequestIndexes) !==
            JSON.stringify(matchedRequestIndexes.slice().sort())
        ) {
          return Promise.reject(
            new Error('Requests not received in the expected order')
          );
        }

        return browser;
      });
    }

    // In a long test, it's possible you might want to reset the list
    // of expected requests after validating some.
    function resetExpectations() {
      this._wdajaxExpectations = [];
      return browser;
    }

    function getExpectations() {
      return this._wdajaxExpectations;
    }

    function getRequests(options = {}) {
      return getRequest(undefined, options);
    }

    async function getRequest(index, options = {}) {
      const request = await browser.execute(
        interceptor.getRequest,
        index > -1 ? index : undefined,
        options
      );
      if (!request) {
        if (index != null) {
          return Promise.reject(
            new Error('Could not find request with index ' + index)
          );
        }
        return [];
      }
      if (Array.isArray(request)) {
        return request.map(transformRequest);
      }
      // The edge driver does not seem to typecast arrays correctly
      if (typeof request[0] == 'object') {
        return mapIndexed(request, transformRequest);
      }
      return transformRequest(request);
    }

    function hasPendingRequests() {
      return browser.execute(interceptor.hasPending);
    }

    function transformRequest(req) {
      if (!req) {
        return;
      }

      const transformed = {
        url: req.url,
        method: req.method && req.method.toUpperCase(),
        headers: normalizeRequestHeaders(req.requestHeaders),
        body: parseBody(req.requestBody),
        pending: true,
      };
      // Check for a '__fulfilled' property on the retrieved request, which is
      // set by the interceptor only when the response completes. Before this
      // flag is set, the request is still being processed (e.g. a large response
      // body is downloading) and therefore is pending.
      if (req.__fulfilled) {
        transformed.pending = false;
        transformed.response = {
          headers: parseResponseHeaders(req.headers),
          body: parseBody(req.body),
          statusCode: req.statusCode,
        };
        if (!req.headers) {
          console.warn(
            `${transformed.method} request to ${req.url} (HTTP ${req.statusCode}) had no response headers!`
          );
        }
      }
      return transformed;
    }

    function normalizeRequestHeaders(headers) {
      const normalized = {};
      Object.keys(headers).forEach((key) => {
        normalized[key.toLowerCase()] = headers[key];
      });
      return normalized;
    }

    // parses raw header to key-value objects
    // (best effort compliance with RFC)
    function parseResponseHeaders(rawHeader) {
      const headers = {};
      if (!rawHeader) {
        return headers;
      }
      const lines = rawHeader.trim().split(/(?:\r?\n)+/);
      for (const line of lines) {
        const parts = line.split(/(?<=^[^:]*):/);
        const key = parts[0].trim().toLowerCase();
        const value = parts[1].trim();
        if (typeof headers[key] == 'undefined') {
          headers[key] = value;
        } else if (typeof headers[key] == 'string') {
          headers[key] = headers[key] + ', ' + value;
        }
      }
      return headers;
    }

    function parseBody(str) {
      let body;
      try {
        body = JSON.parse(str);
      } catch (e) {
        body = str;
      }
      return body;
    }

    // maps an 'array-like' object. returns proper array
    function mapIndexed(obj, fn) {
      const arr = [];
      const max = Math.max.apply(Math, Object.keys(obj).map(Number));
      for (let i = 0; i <= max; i++) {
        arr.push(fn(obj[i], i));
      }
      return arr;
    }
  }
}

exports.default = WebdriverAjax;
