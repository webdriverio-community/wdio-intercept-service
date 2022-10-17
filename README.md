WebdriverIO Intercept Service
=============================

🕸 Capture and assert HTTP ajax calls in [webdriver.io](http://webdriver.io/)

[![Tests](https://github.com/webdriverio-community/wdio-intercept-service/actions/workflows/test.yaml/badge.svg)](https://github.com/webdriverio-community/wdio-intercept-service/actions/workflows/test.yaml) [![Join the chat at https://gitter.im/wdio-intercept-service/community](https://badges.gitter.im/chmanie/wdio-intercept-service.svg)](https://gitter.im/wdio-intercept-service/community)

This is a plugin for [webdriver.io](http://webdriver.io/). If you don't know it yet, check it out, it's pretty cool.

Although selenium and webdriver are used for e2e and especially UI testing, you might want to assess HTTP requests done by your client code (e.g. when you don't have immediate UI feedback, like in metrics or tracking calls). With wdio-intercept-service you can intercept ajax HTTP calls initiated by some user action (e.g. a button press, etc.) and make assertions about the request and corresponding resposes later.

There's one catch though: you can't intercept HTTP calls that are initiated on page load (like in most SPAs), as it requires some setup work that can only be done after the page is loaded (due to limitations in selenium). **That means you can just capture requests that were initiated inside a test.** If you're fine with that, this plugin might be for you, so read on.

## Prerequisites

* webdriver.io **v5.x** or newer.

**Heads up! If you're still using webdriver.io v4, please use the v2.x branch of this plugin!**

## Installation

```
npm install wdio-intercept-service -D
```

## Usage

### Usage with WebDriver CLI

It should be as easy as adding wdio-intercept-service to your `wdio.conf.js`:

```javascript
exports.config = {
  // ...
  services: ['intercept']
  // ...
};
```

and you're all set.

### Usage with WebDriver Standalone

When using WebdriverIO Standalone, the `before` and `beforeTest` / `beforeScenario` functions need to be called manually.

```javascript
import { remote } from 'webdriverio';
import WebdriverAjax from 'wdio-intercept-service'

const WDIO_OPTIONS = {
  port: 9515,
  path: '/',
  capabilities: {
    browserName: 'chrome'
  },
}

let browser;
const interceptServiceLauncher = WebdriverAjax();

beforeAll(async () => {
  browser = await remote(WDIO_OPTIONS)
  interceptServiceLauncher.before(null, null, browser)
})

beforeEach(async () => {
  interceptServiceLauncher.beforeTest()
})

afterAll(async () => {
  await client.deleteSession()
});

describe('', async () => {
  ... // See example usage
});
```

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

Consult the TypeScript declaration file for the the full syntax of the custom commands added to the WebdriverIO browser object. In general, any method that takes an "options" object as a parameter can be called without that parameter to obtain the default behavior. These "optional options" objects are followed by `?: = {}` and the default values inferred are described for each method.

### Option Descriptions

This library offers a small amount of configuration when issuing commands. Configuration options that are used by multiple methods are described here (see each method definition to determine specific support).

* `orderBy` (`'START' | 'END'`): This option controls the ordering of requests captured by the interceptor, when returned to your test. For backwards compatibility with existing versions of this library, the default ordering is `'END'`, which corresponds to when the request was completed. If you set the `orderBy` option to `'START'`, then the requests will be ordered according to the time that they were started.
* `includePending` (`boolean`): This option controls whether not-yet-completed requests will be returned. For backwards compatibility with existing versions of this library, the default value is `false`, and only completed requests will be returned.

### browser.setupInterceptor()

Captures ajax calls in the browser. You always have to call the setup function in order to assess requests later.

### browser.disableInterceptor()

Prevents further capture of ajax calls in the browser. All captured request information is removed. Most users will not need to disable the interceptor, but if a test is particularly long-running or exceeds the session storage capacity, then disabling the interceptor can be helpful.

### browser.excludeUrls(urlRegexes: (string | RegExp)[])

Excludes requests from certain urls from being recorded. It takes an array of strings or regular expressions. Before writing to storage,
tests the url of the request against each string or regex. If it does, the request is not written to storage. Like disableInterceptor, this can be helpful 
if running into problems with session storage exceeding capacity.

### browser.expectRequest(method: string, url: string, statusCode: number)

Make expectations about the ajax requests that are going to be initiated during the test. Can (and should) be chained. The order of the expectations should map to the order of the requests being made.

* `method` (`String`): http method that is expected. Can be anything `xhr.open()` accepts as first argument.
* `url` (`String`|`RegExp`): exact URL that is called in the request as a string or RegExp to match
* `statusCode` (`Number`): expected status code of the response

### browser.getExpectations()

Helper method. Returns all the expectations you've made up until that point

### browser.resetExpectations()

Helper method. Resets all the expectations you've made up until that point

### browser.assertRequests({ orderBy?: 'START' | 'END' }?: = {})

Call this method when all expected ajax requests are finished. It compares the expectations to the actual requests made and asserts the following:

- Count of the requests that were made
- The order of the requests
- The method, the URL and the statusCode should match for every request made
- The options object defaults to `{ orderBy: 'END' }`, i.e. when the requests were completed, to be consistent with the behavior of v4.1.10 and earlier. When the `orderBy` option is set to `'START'`, the requests will be ordered by when they were initiated by the page.

### browser.assertExpectedRequestsOnly({ inOrder?: boolean, orderBy?: 'START' | 'END' }?: = {})

Similar to `browser.assertRequests`, but validates only the requests you specify in your `expectRequest` directives, without having to map out all the network requests that might happen around that. If `inOrder` option is `true` (default), the requests are expected to be found in the same order as they were setup with `expectRequest`.

### browser.getRequest(index: number, { includePending?: boolean, orderBy?: 'START' | 'END' }?: = {})

To make more sophisticated assertions about a specific request you can get details for a specific request. You have to provide the 0-based index of the request you want to access, in the order the requests were completed (default), or initiated (by passing the `orderBy: 'START'` option).

* `index` (`number`): number of the request you want to access
* `options` (`object`): Configuration options
* `options.includePending` (`boolean`): Whether not-yet-completed requests should be returned. By default, this is false, to match the behavior of the library in v4.1.10 and earlier.
* `options.orderBy` (`'START' | 'END'`): How the requests should be ordered. By default, this is `'END'`, to match the behavior of the library in v4.1.10 and earlier. If `'START'`, the requests will be ordered by the time of initiation, rather than the time of request completion. (Since a pending request has not yet completed, when ordering by `'END'` all pending requests will come after all completed requests.)

**Returns** `request` object:

* `request.url`: requested URL
* `request.method`: used HTTP method
* `request.body`: payload/body data used in request
* `request.headers`: request http headers as JS object
* `request.pending`: boolean flag for whether this request is complete (i.e. has a `response` property), or in-flight.
* `request.response`: a JS object that is only present if the request is completed (i.e. `request.pending === false`), containing data about the response.
* `request.response?.headers`: response http headers as JS object
* `request.response?.body`: response body (will be parsed as JSON if possible)
* `request.response?.statusCode`: response status code

**A note on `request.body`:** wdio-intercept-service will try to parse the request body as follows:

* string: Just return the string (`'value'`)
* JSON: Parse the JSON object using `JSON.parse()` (`({ key: value })`)
* FormData: Will output the FormData in the format `{ key: [value1, value2, ...] }`
* ArrayBuffer: Will try to convert the buffer to a string (experimental)
* Anything else: Will use a brutal `JSON.stringify()` on your data. Good luck!

**For the `fetch` API, we only support string and JSON data!**

### browser.getRequests({ includePending?: boolean, orderBy?: 'START' | 'END' }?: = {})

Get all captured requests as an array, supporting the same optional options as `getRequest`.

**Returns** array of `request` objects.

### browser.hasPendingRequests()

A utility method that checks whether any HTTP requests are still pending. Can be used by tests to ensure all requests have completed within a reasonable amount of time, or to verify that a call to `getRequests()` or `assertRequests()` will include all of the desired HTTP requests.

**Returns** boolean

## TypeScript support

This plugin provides its own TS types. Just point your tsconfig to the type extensions like mentioned [here](https://webdriver.io/docs/typescript.html#framework-types):

```
"compilerOptions": {
    // ..
    "types": ["node", "webdriverio", "wdio-intercept-service"]
},
```

## Running the tests

Recent versions of Chrome and Firefox are required to run the tests locally. You may need to update the `chromedriver` and `geckodriver` dependencies to match the version installed on your system.

```shell
npm test
```

## Contributing

I'm happy for every contribution. Just open an issue or directly file a PR.  
Please note that this interceptor library is written to work with legacy browsers such as Internet Explorer. As such, any code used in `lib/interceptor.js` must at least be parseable by Internet Explorer's JavaScript runtime.

## License

MIT
