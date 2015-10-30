'use strict';

var interceptor = require('./lib/interceptor');
var assign = require('object-assign');

function plugin (wdInstance, options) {

    /**
     * instance need to have addCommand method
     */
    if(typeof wdInstance.addCommand !== 'function') {
        throw new Error('you can\'t use WebdriverAjax with this version of WebdriverIO');
    }

    wdInstance.addCommand('setupInterceptor', setup.bind(wdInstance));
    wdInstance.addCommand('expectRequest', expectRequest.bind(wdInstance));
    wdInstance.addCommand('assertRequests', assertRequests.bind(wdInstance));
    wdInstance.addCommand('getRequest', getRequest.bind(wdInstance));
    wdInstance.addCommand('getRequests', getRequest.bind(wdInstance));

    function setup (opts) {
        return this.execute(interceptor.setup, assign({}, options, opts));
    }

    function expectRequest (method, url, status) {
        if (url instanceof RegExp) {
            url = { regex: url.toString() };
        }
        return this.execute(interceptor.expectRequest, method, url, status);
    }

    function assertRequests () {
        return this.execute(interceptor.assertRequests);
    }

    function getRequest (index) {
        return this.execute(interceptor.getRequest, index)
            .then(function (request) {
                if (!request.value) {
                    return Promise.reject(new Error('Could not find request with index ' + index));
                }
                if (Array.isArray(request.value)) {
                    return request.value.map(transformRequest);
                }
                return transformRequest(request.value);
            });
    }

    function transformRequest (req) {
        if (!req) {
            return;
        }
        return {
            url: req.url,
            method: req.method,
            response: {
                headers: parseHeaders(req.headers),
                body: parseBody(req.body),
                status: req.status
            }
        };
    }

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

}

/**
 * expose WebdriverAjax
 */
module.exports.init = plugin;
