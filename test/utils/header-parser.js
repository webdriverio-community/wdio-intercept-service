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

/**
 * Attach the test headers to the given request for a header parsing test
 * @type {import('express').RequestHandler}
 */
function headerMiddleware(req, resp, next) {
  const headerType = req.query.responseHeaders;
  switch (headerType) {
    case 'empty':
      // TODO: still sends some headers, probably due to running on a POST request.
      // Maybe fixed by returning an HTTP 204 No Content.
      resp.getHeaderNames().forEach((name) => {
        console.log('removing header', name);
        resp.removeHeader(name);
      });
      resp.status(204).end();
      return;
    case 'simple':
      resp.setHeader(TestHeaders.simple.name, TestHeaders.simple.value);
      break;
    case 'colon':
      resp.setHeader(TestHeaders.colon.name, TestHeaders.colon.value);
      break;
    case 'multivalue':
      resp.setHeader(TestHeaders.csl.name, ['item-1', 'item-2', 'item-3']);
      break;
    default:
      break;
  }
  next();
}

module.exports = {
  TestHeaders,
  headerMiddleware,
};
