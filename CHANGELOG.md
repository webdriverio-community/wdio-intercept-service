## wdio-intercept-service changelog

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v.next) ] v.next / <DATE>
- Handle responses with no headers (thanks @dragosMC91)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.3.0) ] 4.3.0 / 17.10.2022
- Fix header-parsing code to be RFC-compliant (thanks @jbebe)
- Add new method to allow disabling request interception (thanks @muhserks)
- Disable the wdio-pause lint rule (thanks @tehhowch)
- Add new method to allow excluding urls from being saved to session storage (thanks @x3700x)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.2.2) ] 4.2.2 / 28.02.2022
- Wrap xhr::abort and add tests for angular (thanks @lildesert)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.2.1) ] 4.2.1 / 20.12.2021
- fix(#196): requestBody are empty when doing a POST+URLSearchParams (thanks @Badisi)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.2.0) ] 4.2.0 / 07.12.2021
- Intercept HTTP requests upon initiation, rather than completion (thanks @tehhowch)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.1.10) ] 4.1.10 / 16.11.2021
* Support fetch requests opened with `URL` objects (thanks @tehhowch)
* Fix return type for `browser.getExpectations()` (thanks @tehhowch)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.1.9) ] 4.1.9 / 03.11.2021
* Run e2e tests in async mode (thanks @tehhowch)
* Support 'blob' response types in XHR requests (thanks @tehhowch)
* Run e2e tests for Firefox, too (thanks @tehhowch)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.1.8) ] 4.1.8 / 28.10.2021
* Maintenance upgrade to help enforce IE compatability (thanks @tehhowch)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.1.7) ] 4.1.7 / 04.08.2021
* Add support for WebdriverIO standalone mode (thanks @juenobueno)

### [ [>](https://github.com/webdriverio-community/wdio-intercept-service/tree/v4.1.6) ] 4.1.6 / 19.05.2021
* Maintenance upgrades (thanks @christian-bromann)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v4.1.4) ] 4.1.4 / 19.04.2021
Improved support for parallelization (thanks @RaulGDMM)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v4.1.3) ] 4.1.3 / 04.03.2021
Support ArrayBuffer decoding (thanks @cesar-rivera)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v4.1.2) ] 4.1.2 / 30.04.2020
* Maintenance upgrade (package upgrades and spring cleaning)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v4.1.1) ] 4.1.1 / 04.04.2020
* Fix plugin TypeScript types for async mode (thanks @louis-bompart)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v4.1.0) ] 4.1.0 / 01.04.2020
* Update webdriverio dependencies
* Fix undefined array returned from interceptor bug

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v4.0.0) ] 4.0.0 / 24.01.2020
* Add full typescript support for the plugin
* Drop Node v8 support (out of LTS)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v3.1.1) ] 3.1.1 / 11.01.2020
* Fix incorrect check for assertExpectedRequestsOnly (thanks @chrisdraycott)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v3.1.0) ] 3.1.0 / 08.01.2020
* Add option to validate only expected requests (thanks @chrisdraycott)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v3.0.3) ] 3.0.3 / 05.12.2019
* Fix issues with IE11 (thanks @vrockai)
* Fix undefined init values in `fetch` requests (thanks @lacell75)
* Upgrade all dependencies
* Fix a pre-commit issue

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v3.0.2) ] 3.0.2 / 21.02.2019
* Fix the module exports (thanks @abjerstedt)

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v3.0.1) ] 3.0.1 / 13.02.2019
* Properly rename to wdio-intercept-service

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v3.0.0) ] 3.0.0 / 13.02.2019
* Rename to wdio-intercept-service
* Bump webdriverio dependency to v5
* Add `fetch` support! 🎉

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v2.2.0) ] 2.2.0 / 23.01.2018
* Add possibility to assess request headers
* Improve error messages
* Add test for iframe assertions
* Fix chrome issue on CI

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v2.1.1) ] 2.1.1 / 15.12.2017
* Fix problems with newer versions of selenium

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v2.1.0) ] 2.1.0 / 31.10.2017
* Add possibility to assess the requests payload using `request.body`

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v2.0.0) ] 2.0.0 / 18.04.2017
* Support for webdriver.io v4.x

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v1.1.1) ] 1.1.1 / 18.04.2017
* Add support for blobs using `xhr.response`
* Update test browser versions
* Update eslint
* Some clean up

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v1.1.0) ] 1.1.0 / 05.02.2016
* Add possibility to persist data during page changes using `sessionStorage`

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v1.0.3) ] 1.0.3 / 27.01.2016
* Add tests for manual initialisation

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v1.0.2) ] 1.0.2 / 01.11.2015
* Readme adjustments?

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v1.0.1) ] 1.0.1 / 01.11.2015
* Fix selenium-standalone postinstall issue

### [ [>](https://github.com/chmanie/wdio-intercept-service/tree/v1.0.0) ] 1.0.0 / 01.11.2015
* Initial release
