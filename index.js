'use strict';

var interceptor = require('./lib/interceptor');

function plugin (wdInstance, options) {

    /**
     * instance need to have addCommand method
     */
    if(typeof wdInstance.addCommand !== 'function') {
        throw new Error('you can\'t use WebdriverAjax with this version of WebdriverIO');
    }

    function setup (opts) {
        return this.execute(interceptor.setup, opts);
    }

    function expectRequest (method, url, status) {
        return this.execute(interceptor.expectRequest, method, url, status);
    }

    function flushInterceptor () {
        return this.execute(interceptor.assertAllRequests);
    }

    wdInstance.addCommand('setupInterceptor', setup.bind(wdInstance));
    wdInstance.addCommand('expectRequest', expectRequest.bind(wdInstance));
    wdInstance.addCommand('flushInterceptor', flushInterceptor.bind(wdInstance));

}

/**
 * expose WebdriverAjax
 */
module.exports.init = plugin;
