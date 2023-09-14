const path = require('path');
const plugin = require('../index.js').default;
const localServer = require('./utils/express');

// To support testing in both GitHub Actions and locally, configure
// `wdio-chromedriver-service` based on environment variables.
// Ref: https://github.com/actions/virtual-environments/blob/main/images/linux/Ubuntu2004-README.md#browsers-and-drivers
const chromedriver = !process.env.CHROMEWEBDRIVER
  ? 'chromedriver' // running locally
  : [
      'chromedriver',
      {
        chromedriverCustomPath: path.join(
          process.env.CHROMEWEBDRIVER,
          process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver',
        ),
      },
    ];

const geckodriver = 'geckodriver'; // running locally, or in CI.

exports.config = {
  //
  // ====================
  // Runner Configuration
  // ====================
  //
  // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
  // on a remote machine).
  runner: 'local',

  //
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // from which `wdio` was called. Notice that, if you are calling `wdio` from an
  // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
  // directory is where your package.json resides, so `wdio` will be called from there.
  //
  specs: [__dirname + '/spec/plugin_test.js'],
  // Patterns to exclude.
  exclude: [
    // 'path/to/excluded/files'
  ],
  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: 10,
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://docs.saucelabs.com/reference/platforms-configurator
  //
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--headless', '--disable-gpu'],
      },
    },
    {
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: ['-headless'],
      },
    },
  ],
  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error
  logLevel: 'trace',
  outputDir: __dirname + '/logs',
  //
  // Warns when a deprecated command is used
  deprecationWarnings: true,
  //
  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,
  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: 'http://localhost:8080',
  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 10000,
  //
  // Default timeout in milliseconds for request
  // if Selenium Grid doesn't send response
  connectionRetryTimeout: 90000,
  //
  // Default request retries count
  connectionRetryCount: 3,
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: [chromedriver, geckodriver, [plugin, {}]],
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks.html
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'mocha',
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter.html
  reporters: ['spec'],

  // Options to be passed to Mocha.
  // See the full list at http://mochajs.org/
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  onPrepare: function (/* config, capabilities */) {
    // Start the express server and configure middleware. Inspired by wdio-static-server-service, but
    // allows us to run middleware for HTTP GET requests, too.
    return localServer.onPrepare(...arguments);
  },
  onComplete: function (/* exitCode, config, capabilities, results */) {
    return localServer.onComplete(...arguments);
  },
};
