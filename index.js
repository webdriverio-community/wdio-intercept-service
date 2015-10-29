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
    wdInstance.addCommand('flushInterceptor', flushInterceptor.bind(wdInstance));

    function setup (opts) {
        return this.execute(interceptor.setup, assign({}, options, opts));
    }

    function expectRequest (method, url, status) {
        if (url instanceof RegExp) {
            url = { regex: url.toString() };
        }
        return this.execute(interceptor.expectRequest, method, url, status);
    }

    function flushInterceptor () {
        return this.execute(interceptor.assertAllRequests);
    }

}

/**
 * expose WebdriverAjax
 */
module.exports.init = plugin;
