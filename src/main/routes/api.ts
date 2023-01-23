import { HTTPError } from '../HttpError';
import { ArdoqClient } from '../modules/ardoq/ArdoqClient';
import { DependencyParser } from '../modules/ardoq/DependencyParser';
import { GradleParser } from '../modules/ardoq/GradleParser';
import { IParser } from '../modules/ardoq/IParser';
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

  const handleRequest = function (parser: IParser, req: express.Request, res: express.Response) {
    const reqBody = Buffer.from(req.body, 'base64').toString('binary');
    requestProcessor.processRequest(res, DependencyParser.fromDepString(parser, reqBody));
  };

  const getParser = function (req: express.Request): IParser {
    const parser = req.query.parser;
    if (parser === 'maven') {
      return new MavenParser();
    } else if (parser === 'gradle') {
      return new GradleParser();
    } else {
      throw new HTTPError('Parser not supported', 400);
    }
  };

  app.post('/api/:parser/:repo', async (req, res, next) => {
    try {
      handleRequest(getParser(req), req, res);
    } catch (err) {
      next(err);
    }
  });
}
