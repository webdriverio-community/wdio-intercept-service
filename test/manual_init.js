'use strict';

var webdriverio = require('webdriverio');
var wdajax = require('../');
var utils = require('./utils');

var config = require('../wdio.conf').config;

var client;

describe('manual initialisation', function () {

    if (process.env.CI === 'true') {
        // Don't run manual initialisation tests in CI
        return;
    }

    before(utils.startSelenium);
    before(utils.startStaticServer);
    before(function init () {
        client = webdriverio.remote({
            desiredCapabilities: {
                browserName: 'chrome'
            }
        });

        wdajax.init(client);

        client.options.baseUrl = config.baseUrl;
        GLOBAL.browser = client;

        return client.init();
    });

    after(function () {
        return client.end()
            .then(utils.stopStaticServer)
            .then(utils.stopSelenium);
    });

    require('./spec/plugin_test');

});
