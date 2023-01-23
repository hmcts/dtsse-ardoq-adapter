import { ArdoqClient } from '../modules/ardoq/ArdoqClient';
import { DependencyParser } from '../modules/ardoq/DependencyParser';
import { GradleParser } from '../modules/ardoq/GradleParser';
import { MavenParser } from '../modules/ardoq/MavenParser';
import { RequestProcessor } from '../modules/ardoq/RequestProcessor';

import axios from 'axios';
import config from 'config';
import express, { Application } from 'express';

export default function (app: Application): void {
  const client = new ArdoqClient(
    axios.create({
      baseURL: config.get('ardoq.apiUrl'),
      headers: {
        Authorization: 'Token token=' + config.get('ardoq.apiKey'),
      },
    }),
    config.get('ardoq.apiWorkspace')
  );
  const requestProcessor = new RequestProcessor(client);

  const handleRequest = function (parser: DependencyParser, req: express.Request, res: express.Response) {
    const reqBody = Buffer.from(req.body, 'base64').toString('binary');
    requestProcessor.processRequest(res, parser.fromDepString(reqBody));
  };

  app.post('/api/gradle/:repo', async (req, res, next) => {
    try {
      handleRequest(new GradleParser(), req, res);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/maven/:repo', async (req, res, next) => {
    try {
      handleRequest(new MavenParser(), req, res);
    } catch (err) {
      next(err);
    }
  });
}
