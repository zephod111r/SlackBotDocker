import express from 'express';
import { log } from './utils';
import * as cotd from './commands/cotd';
import * as card from './commands/card';
import * as verification from './events/verification';
import * as message from './events/message';

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


const eventMap = {
  "url_verification": params => verification.handleEvent(params),
  "event_callback": params => {
    return (eventCallbackMap[params.event.type] ? eventCallbackMap[params.event.type] : eventCallbackMap['404'])(params.event)
  },
  '404': params => Promise.reject({
    code: 200,
    message: `${params.type} not found.`
  })
}
const eventCallbackMap = {
  "message": params => message.handleEvent(params),
  '404': params => Promise.reject({
    code: 200,
    message: `Event ${params.type} not found.`
  })
}

router.post('/slack/events', async (req, res) => {
  const promise = (eventMap[req.body.type] ? eventMap[req.body.type] : eventMap['404'])(req.body)

  promise.then(data => {
    return res.status(200).header('Content-Type', 'application/json').send(JSON.stringify(data))
  }, err => {
    log.error(err);
    return res.status(err.code || 500).send(err.message || 'Something blew up. We\'re looking into it.');
  })
});

export default router;