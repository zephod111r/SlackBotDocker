import 'babel-polyfill';

import express from 'express';
import http from 'http';

import bootstrap from './bootstrap';
import { log, normalizePort } from './utils';

const port = 3000;

const app = express();
app.start = async () => {
  log.info('Starting Server...');
  app.set('port', port);
  bootstrap(app);
  const server = http.createServer(app);

  server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    log.error(`Failed to start server: ${error}`);
    process.exit(1);
  });

  server.on('listening', () => {
    const address = server.address();
    log.info(`Server listening ${address.address}:${address.port}`);
  });

  server.listen(port);
};

app.start().catch((err) => {
  log.error(err);
});

export default app;