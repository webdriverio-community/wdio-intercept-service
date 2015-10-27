'use strict';

var assert = require('assert');

describe('simple GET request', function () {

  it('makes a simple get request', function () {

    return browser.url('/simple_get.html')
      .getTitle()
      .then(function (title) {
        assert.equal(title, 'Simple get');
      });

  });

});
