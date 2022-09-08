// Not much to test on headers, these 3 are good enough
const TestHeaders = {
  simple: {
    name: 'x-test-simple',
    value: 'simple value',
  },
  colon: {
    name: 'x-test-colon',
    value: 'co : lon',
  },
  csl: {
    name: 'x-test-csl',
    value: 'item-1, item-2, item-3',
  },
};

function injectTestHeaders(res) {
  try {
    // access property on 'res' object that stores headers
    // sadly it's not a simple string property but a symbol-keyed one
    const headersKey = Object.getOwnPropertySymbols(res).find(
      (x) => x.description === 'kOutHeaders'
    );
    res[headersKey][TestHeaders.simple.name] = [
      TestHeaders.simple.name,
      TestHeaders.simple.value,
    ];
    res[headersKey][TestHeaders.colon.name] = [
      TestHeaders.colon.name,
      TestHeaders.colon.value,
    ];
    for (let i = 1; i <= 3; ++i) {
      // observation: the name of the header can be anything unique, node/http only cares about the value
      res[headersKey][TestHeaders.csl.name + i] = [
        TestHeaders.csl.name,
        `item-${i}`,
      ];
    }
  } catch (ex) {
    console.error('Unable to inject test headers to response object');
    throw ex;
  }
}

module.exports = {
  TestHeaders,
  injectTestHeaders,
};
