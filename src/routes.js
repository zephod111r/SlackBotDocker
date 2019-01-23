import express from 'express';
import { log } from './utils';
import * as cotd from './commands/cotd';
import * as card from './commands/card';

const router = new express.Router();

const commandMap = {
  '/cotd' : params => cotd.handleCommand(params),
  '/card' : params => card.handleCommand(params),
  '404': params => Promise.reject({
    code: 404,
    message: `${params.command} not found.`
  })
}

router.get('/healthcheck', async (req, res) => {
  res.status(200).header('Content-Type', 'application/json').send(JSON.stringify({status: 'Good'}))
});

router.post('/slack/command', async (req, res) => {
  const promise = (commandMap[req.body.command] ? commandMap[req.body.command] : commandMap['404'])(req.body)

  promise.then(data => {
    return res.status(200).header('Content-Type', 'application/json').send(JSON.stringify(data))
  }, err => {
    log.error(err);
    return res.status(err.code || 500).send(err.message || 'Something blew up. We\'re looking into it.');
  })
});

export default router;