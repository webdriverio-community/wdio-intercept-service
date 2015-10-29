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
    wdInstance.addCommand('getResponse', getResponse.bind(wdInstance));

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

    function getResponse (index) {
        return this.execute(interceptor.getResponse, index)
            .then(function (response) {
                return response && response.value;
            });
    }

}

/**
 * expose WebdriverAjax
 */
module.exports.init = plugin;
