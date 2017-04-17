'use strict';

var path = require('path');

var assign = require('object-assign');
var utils = require('./test/utils');

var capabilities;

if (process.env.CI === 'true') {

    capabilities = [{
        browserName: 'firefox',
        version: '52.0',
        platform: 'macOS 10.12'
    }, {
        browserName: 'chrome',
        version: '57.0',
        platform: 'macOS 10.12'
    }, {
        browserName: 'safari',
        version: '10.0',
        platform: 'macOS 10.12'
    }, {
        browserName: 'safari',
        version: '9.0',
        platform: 'OS X 10.11'
    }, {
        browserName: 'safari',
        version: '8.0',
        platform: 'OS X 10.10'
    }, {
        browserName: 'MicrosoftEdge',
        version: '14.14393',
        platform: 'Windows 10'
    }, {
        browserName: 'MicrosoftEdge',
        version: '13.10586',
        platform: 'Windows 10'
    }, {
        browserName: 'internet explorer',
        version: '11.0',
        platform: 'Windows 10'
    }, {
        browserName: 'internet explorer',
        version: '10.0',
        platform: 'Windows 8'
    }, {
        browserName: 'internet explorer',
        version: '9.0',
        platform: 'Windows 7'
    }, {
        browserName: 'Safari',
        appiumVersion: '1.6.4',
        platformName: 'iOS',
        platformVersion: '10.2',
        deviceName: 'iPhone 7 Plus Simulator',
        deviceOrientation: 'portrait'
    }, {
        browserName: 'Safari',
        appiumVersion: '1.6.4',
        platformName: 'iOS',
        platformVersion: '9.3',
        deviceName: 'iPhone 6s Plus Simulator',
        deviceOrientation: 'portrait'
    }, {
        browserName: 'Safari',
        appiumVersion: '1.6.4',
        platformName: 'iOS',
        platformVersion: '8.4',
        deviceName: 'iPhone 6 Plus Simulator',
        deviceOrientation: 'portrait'
    }].map(function (capability) {
        return assign(capability, {
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
            name: 'integration',
            build: process.env.TRAVIS_BUILD_NUMBER,
            public: true
        });
    });

} else {
    capabilities = [{
        browserName: 'chrome'
    }];
}

var plugin = path.resolve(__dirname, 'index.js');

var config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    specs: [
        './test/spec/plugin_test.js'
    ],
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilties at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude option in
    // order to group specific specs to a specific capability.
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: capabilities,
    services: ['sauce'],
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity.
    logLevel: 'silent',
    //
    // Enables colors for log output.
    coloredLogs: true,
    //
    // Saves a screenshot to a given path if a command fails.
    screenshotPath: './errorShots/',
    //
    // Set a base URL in order to shorten url command calls. If your url parameter starts
    // with "/", the base url gets prepended.
    baseUrl: 'http://localhost:8080',
    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 10000,
    //
    // Initialize the browser instance with a WebdriverIO plugin. The object should have the
    // plugin name as key and the desired plugin options as property. Make sure you have
    // the plugin installed before running any tests. The following plugins are currently
    // available:
    // WebdriverCSS: https://github.com/webdriverio/webdrivercss
    // WebdriverRTC: https://github.com/webdriverio/webdriverrtc
    // Browserevent: https://github.com/webdriverio/browserevent
    plugins: {
    },
    //
    // Framework you want to run your specs with.
    // The following are supported: mocha, jasmine and cucumber
    // see also: http://webdriver.io/guide/testrunner/frameworks.html
    //
    // Make sure you have the node package for the specific framework installed before running
    // any tests. If not please install the following package:
    // Mocha: `$ npm install mocha`
    // Jasmine: `$ npm install jasmine`
    // Cucumber: `$ npm install cucumber`
    framework: 'mocha',
    //
    // Test reporter for stdout.
    // The following are supported: dot (default), spec and xunit
    // see also: http://webdriver.io/guide/testrunner/reporters.html
    reporter: process.env.CI ? 'dot' : 'spec',

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd'
    },

    //
    // =====
    // Hooks
    // =====
    // Run functions before or after the test. If one of them returns with a promise, WebdriverIO
    // will wait until that promise got resolved to continue.
    // see also: http://webdriver.io/guide/testrunner/hooks.html
    //
    // Gets executed before all workers get launched.
    onPrepare: function() {
        var jobs = [utils.startStaticServer()];
        if (!process.env.CI) {
            jobs.push(utils.startSelenium());
        }
        return Promise.all(jobs);
    },
    //
    // Gets executed before test execution begins. At this point you will have access to all global
    // variables like `browser`. It is the perfect place to define custom commands.
    before: function() {
        // do something
    },
    //
    // Gets executed after all tests are done. You still have access to all global variables from
    // the test.
    after: function(failures, pid) {},
    //
    // Gets executed after all workers got shut down and the process is about to exit. It is not
    // possible to defer the end of the process using a promise.
    onComplete: function() {
        var jobs = [utils.stopStaticServer()];
        if (!process.env.CI) {
            jobs.push(utils.stopSelenium());
        }
        return Promise.all(jobs);
    }
};

config.plugins[plugin] = {};

exports.config = config;
