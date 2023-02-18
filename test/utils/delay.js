/**
 * Attach the test headers to the given request for a header parsing test
 * @type {import('express').RequestHandler}
 */
async function delayMiddleware(req, resp, next) {
  const delay = req.query.slow === 'true' ? 1000 : 0;
  setTimeout(next, delay);
}

exports.delayMiddleware = delayMiddleware;
