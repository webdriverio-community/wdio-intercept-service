# webdriverajax

🕸 Capture and assert HTTP ajax calls in [webdriver.io](http://webdriver.io/)

[![Greenkeeper badge](https://badges.greenkeeper.io/chmanie/webdriverajax.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.org/chmanie/webdriverajax.svg?branch=master)](https://travis-ci.org/chmanie/webdriverajax) [![Join the chat at https://gitter.im/chmanie/webdriverajax](https://badges.gitter.im/chmanie/webdriverajax.svg)](https://gitter.im/chmanie/webdriverajax?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a plugin for [webdriver.io](http://webdriver.io/). If you don't know it yet, check it out, it's pretty cool.

Although selenium and webdriver are used for e2e and especially UI testing, you might want to assess HTTP requests done by your client code (e.g. when you don't have immediate UI feedback, like in metrics or tracking calls). With webdriverajax you can intercept ajax HTTP calls initiated by some user action (e.g. a button press, etc.) and make assertions about the request and corresponding resposes later.

There's one catch though: you can't intercept HTTP calls that are initiated on page load (like in most SPAs), as it requires some setup work that can only be done after the page is loaded (due to limitations in selenium). **That means you can just capture requests that were initiated inside a test.** If you're fine with that, this plugin might be for you, so read on.

## Prerequisites

* webdriver.io **v4.x**.

**Heads up! If you're still using webdriver.io v3, please use the v1.x branch of this plugin!**

## Installation

Use [yarn](https://yarnpkg.com):

```
yarn add webdriverajax -D
```

[npm](https://npmjs.org) works as well:

```
npm install webdriverajax -D
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

Once initialized, some related functions are added to your browser command chain (see [API](#api)).

## Quickstart

Example usage:

```javascript
browser.url('http://foo.bar');
browser.setupInterceptor(); // capture ajax calls
browser.expectRequest('GET', '/api/foo', 200); // expect GET request to /api/foo with 200 statusCode
browser.expectRequest('POST', '/api/foo', 400); // expect POST request to /api/foo with 400 statusCode
browser.expectRequest('GET', /\/api\/foo/, 200); // can validate a URL with regex, too
browser.click('#button'); // button that initiates ajax request
browser.pause(1000); // maybe wait a bit until request is finished
browser.assertRequests(); // validate the requests
```

Get details about requests:

```javascript
browser.url('http://foo.bar')
browser.setupInterceptor();
browser.click('#button')
browser.pause(1000);

var request = browser.getRequest(0);
assert.equal(request.method, 'GET');
assert.equal(request.response.headers['content-length'], '42');
```

## Supported browsers

It should work with somewhat newer versions of all browsers. Please report an issue if it doesn't seem to work with yours.

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

**Returns** `request` object:

* `request.url`: requested URL
* `request.method`: used HTTP method
* `request.body`: payload/body data used in request
* `request.headers`: request http headers as JS object
* `request.response.headers`: response http headers as JS object
* `request.response.body`: response body (will be parsed as JSON if possible)
* `request.response.statusCode`: response status code

**A note on `request.body`:** webdriverajax will try to parse the request body as follows:

* string: Just return the string (`'value'`)
* JSON: Parse the JSON object using `JSON.parse()` (`({ key: value })`)
* FormData: Will output the FormData in the format `{ key: [value1, value2, ...] }`
* ArrayBuffer: Will try to convert the buffer to a string (experimental)
* Anything else: Will use a brutal `JSON.stringify()` on your data. Good luck!

### browser.getRequests()

Get all captured requests as an array.

**Returns** array of `request` objects.

## Running the tests

A compatible browser (Firefox, Chrome) has to be installed. Also install selenium standalone via:

```shell
node_modules/.bin/selenium-standalone install
```

then

```shell
yarn test # npm test works as well :)
```

## Contributing

I'm happy for every contribution. Just open an issue or directly file a PR.

## License

MIT
