const express = require('express');
const path = require('path');
const { headerMiddleware } = require('./header-parser');
const { delayMiddleware } = require('./delay');

/** @type {import('http').Server} */
let server;

async function initialize({ baseUrl }) {
  const app = express();

  // Add the header middleware for all requests
  app.use(headerMiddleware);
  // Add the "slow request" middleware for all requests
  app.use(delayMiddleware);

  // Serve '/' from disk
  const resources = path.normalize(`${__dirname}/../site`);
  app.use('/', express.static(resources));

  // Handle POST
  app.use((req, resp, nextFn) => {
    if (req.method === 'POST') {
      // resp.sendFile(`${resources}${req.path}`);
      resp.json({ OK: true });
    } else {
      nextFn();
    }
  });

  // Start listening for requests
  const { port } = new URL(baseUrl);
  server = app.listen(port);
}

function shutdown() {
  return server?.unref();
}

exports.onPrepare = initialize;
exports.onComplete = shutdown;
