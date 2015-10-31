# webdriverajax
Capture and assert HTTP ajax calls in [webdriver.io](http://webdriver.io/)

![Travis badge](https://travis-ci.org/chmanie/webdriverajax.svg?branch=master)

This is a plugin for [webdriver.io](http://webdriver.io/). If you don't know it yet, check it out, it's pretty cool.
**Heads up!** It's meant to be used with webdriver.io **v3.x**. So make sure you're using the correct version.

Although selenium and webdriver are used for e2e and especially UI testing, you might want to assess HTTP requests done by your client code (e.g. when you don't have immediate UI feedback, like in metrics or tracking calls). With webdriverajax you can intercept ajax HTTP calls initiated by some user action (e.g. a button press, etc.) and make assertions about the request and corresponding resposes later.

There's one catch though: you can't intercept HTTP calls that are initiated on page load (like in most SPAs), as it requires some setup work that can only be done after the page is loaded (due to limitations in selenium). **That means you can just capture requests that were initiated inside a test.** If you're fine with that, this plugin might be for you, so read on.

## Installation

Use [npm](https://npmjs.org):

```
npm install webdriverajax
```

## Usage

#### Using with `wdio`

If you use the integrated [test-runner](http://webdriver.io/guide/testrunner/gettingstarted.html) (`wdio`) it's as easy as adding webdriverajax to your `wdio.conf.js`:

```javascript
plugins: {
  webdriverajax: {}
}
```

and you're all set.

#### Programatic usage

You should require the package and call the config function with your webdriver-instance (`client` or `browser` or whatever you call it) before you initialize it with `.init()`. So for example (using [mocha](https://mochajs.org/)):

```javascript
var wdajax = require('webdriverajax');

var client = webdriverio.remote({
  desiredCapabilities: {
    browserName: 'firefox'
  }
});

before(function() {
  wdajax.init(client);
  return client.init();
});
```

Once initialized, some related functions are added to you browser command chain (see [API](#api)).

## Quickstart

Example usage (promise-style):

```javascript
browser
  .url('http://foo.bar')
  .setupInterceptor() // capture ajax calls
  .expectRequest('GET', '/api/foo', 200) // expect GET request to /api/foo with 200 statusCode
  .expectRequest('POST', '/api/foo', 400) // expect POST request to /api/foo with 400 statusCode
  .expectRequest('GET', /\/api\/foo/, 200) // can validate a URL with regex, too
  .click('#button') // button that initiates ajax request
  .pause(1000) // maybe wait a bit until request is finished
  .assertRequests(); // validate the requests
```

Get details about requests (generator-style):

```javascript
yield browser.url('http://foo.bar')
    .setupInterceptor()
    .click('#button')
    .pause(1000);

var request = yield browser.getRequest(0);
assert.equal(request.method, 'GET');
assert.equal(request.response.headers['content-length'], '42');
```

## Supported browsers

It should work with somewhat newer versions of all browsers.

![Browser matrix](https://saucelabs.com/browser-matrix/webdriverajax.svg)

## API

### browser.setupInterceptor()

Captures ajax calls in the browser. You always have to call the setup function in order to assess requests later.

### browser.expectRequest(method, url, statusCode)

Make expectations about the ajax requests that are going to be initiated during the test. Can (and should) be chained. The order of the expectations should map to the order of the requests being made.

* `method` (`String`): http method that is expected. Can be anything `xhr.open()` accepts as first argument.
* `url` (`String`|`RegExp`): exact URL that is called in the request as a string or RegExp to match
* `statusCode` (`Number`): expected status code of the response

### browser.assertRequests()

Call this method when all expected ajax requests are finished. It compares the expectations to the actual requests made and asserts the following:

- Count of the requests that were made
- The order of the requests
- The method, the URL and the statusCode should match for every request made

### browser.getRequest(index)

To make more sophisticated assertions about a specific request you can get details for a specific request after it is finished. You have to provide the index of the request you want to access in the order the requests were initiated (starting with 0).

* `index` (`Number`): number of the request you want to access

**Returns**: Promise that resolves to `request` object:

* `request.url`: requested URL
* `request.method`: used HTTP method
* `request.response.headers`: response http headers as JS object
* `request.response.body`: response body (will be parsed as JSON if possible)
* `request.response.statusCode`: response status code

### browser.getRequests()

Get all captured requests as an array.

**Returns**: Promise that resolves to an array of `request` objects.

## Running the tests

Firefox has to be installed. Also install selenium standalone via:

```
node_modules/.bin/selenium-standalone install
```

then

```
npm test
```

## Contributing

I'm happy for every contribution. Just open an issue or directly file a PR.

## License

MIT
