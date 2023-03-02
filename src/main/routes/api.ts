import { HTTPError } from '../HttpError';
import { isAuthorised } from '../auth';
import { ArdoqClient } from '../modules/ardoq/ArdoqClient';
import { ArdoqComponentCreatedResponse } from '../modules/ardoq/ArdoqComponentCreatedResponse';
import { DependencyParser, DependencyParserError } from '../modules/ardoq/DependencyParser';
import { GradleParser } from '../modules/ardoq/GradleParser';
import { MavenParser } from '../modules/ardoq/MavenParser';
import { RequestProcessor } from '../modules/ardoq/RequestProcessor';
import { YarnParser } from '../modules/ardoq/YarnParser';

import axios from 'axios';
import config from 'config';
import { Application } from 'express';

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

  const parsers = {
    gradle: new DependencyParser(new GradleParser()),
    maven: new DependencyParser(new MavenParser()),
    yarn: new DependencyParser(new YarnParser()),
  } as Record<string, DependencyParser>;

  app.post('/api/:parser/:repo', isAuthorised, (req, res, next) => {
    try {
      const parser: DependencyParser = parsers[req.params.parser];
      if (parser === undefined) {
        next(new HTTPError('Parser not supported', 400));
      }
      const reqBody = Buffer.from(req.body, 'base64').toString('utf8');
      const requestProcessor = new RequestProcessor(client);
      requestProcessor.processRequest(parser.fromDepString(reqBody)).then(ardoqResult => {
        res.statusCode = 200;
        if ((ardoqResult.get(ArdoqComponentCreatedResponse.CREATED) ?? 0) > 0) {
          res.statusCode = 201;
        }
        res.contentType('application/json');
        res.send(JSON.stringify(Object.fromEntries(ardoqResult)));
      });
    } catch (err) {
      if (err instanceof DependencyParserError) {
        next(new HTTPError(err.message, 400));
      } else {
        next(err);
      }
    }
  });
}
