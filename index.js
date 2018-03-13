'use strict';

const interceptor = require('./lib/interceptor');

function plugin(wdInstance, options) {
  /**
   * instance need to have addCommand method
   */
  if (typeof wdInstance.addCommand !== 'function') {
    throw new Error(
      "you can't use WebdriverAjax with this version of WebdriverIO"
    );
  }

  wdInstance.addCommand('setupInterceptor', setup.bind(wdInstance));
  wdInstance.addCommand('expectRequest', expectRequest.bind(wdInstance));
  wdInstance.addCommand('assertRequests', assertRequests.bind(wdInstance));
  wdInstance.addCommand('getRequest', getRequest.bind(wdInstance));
  wdInstance.addCommand('getRequests', getRequest.bind(wdInstance));

  function setup() {
    wdInstance.__wdajaxExpectations = [];
    return wdInstance.executeAsync(interceptor.setup);
  }

  function expectRequest(method, url, statusCode) {
    wdInstance.__wdajaxExpectations.push({
      method: method.toUpperCase(),
      url: url,
      statusCode: statusCode
    });
    return {};
  }

  function assertRequests() {
    const expectations = wdInstance.__wdajaxExpectations;

    if (!expectations.length) {
      return Promise.reject(
        new Error('No expectations found. Call .expectRequest() first')
      );
    }
    return getRequest().then(requests => {
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

      return wdInstance;
    });
  }

  function getRequest(index) {
    return wdInstance.execute(interceptor.getRequest, index).then(request => {
      if (!request.value) {
        if (index != null) {
          return Promise.reject(
            new Error('Could not find request with index ' + index)
          );
        }
        return [];
      }
      if (Array.isArray(request.value)) {
        return request.value.map(transformRequest);
      }
      // The edge driver does not seem to typecast arrays correctly
      if (typeof request.value[0] == 'object') {
        return mapIndexed(request.value, transformRequest);
      }
      return transformRequest(request.value);
    });
  }

  function transformRequest(req) {
    if (!req) {
      return;
    }

    return {
      url: req.url,
      method: req.method && req.method.toUpperCase(),
      body: parseBody(req.requestBody),
      headers: normalizeRequestHeaders(req.requestHeaders),
      response: {
        headers: parseResponseHeaders(req.headers),
        body: parseBody(req.body),
        statusCode: req.statusCode
      }
    };
  }

  function normalizeRequestHeaders(headers) {
    const normalized = {};
    Object.keys(headers).forEach(key => {
      normalized[key.toLowerCase()] = headers[key];
    });
    return normalized;
  }

  function parseResponseHeaders(str) {
    const headers = {};
    const arr = str
      .trim()
      .replace(/\r/g, '')
      .split('\n');
    arr.forEach(header => {
      const match = header.match(/^(.+)?:\s?(.+)$/);
      if (match) {
        headers[match[1].toLowerCase()] = match[2];
      }
    });
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

/**
 * expose WebdriverAjax
 */
exports.init = plugin;
