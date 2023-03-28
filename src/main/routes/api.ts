import { HTTPError } from '../HttpError';
import { isAuthorised } from '../auth';
import { ArdoqClient } from '../modules/ardoq/ArdoqClient';
import { ArdoqComponentCreatedStatus } from '../modules/ardoq/ArdoqComponentCreatedStatus';
import { ArdoqRequest } from '../modules/ardoq/ArdoqRequest';
import { DependencyParser, DependencyParserError } from '../modules/ardoq/DependencyParser';
import { DotnetParser } from '../modules/ardoq/DotnetParser';
import { GradleParser } from '../modules/ardoq/GradleParser';
import { MavenParser } from '../modules/ardoq/MavenParser';
import { NPMParser } from '../modules/ardoq/NPMParser';
import { PipParser } from '../modules/ardoq/PipParser';
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
        Authorization: 'Bearer ' + config.get('ardoq.apiKey'),
      },
    })
  );

  const parsers = {
    gradle: new DependencyParser(new GradleParser()),
    maven: new DependencyParser(new MavenParser()),
    yarn: new DependencyParser(new YarnParser()),
    dotnet: new DependencyParser(new DotnetParser()),
    npm: new DependencyParser(new NPMParser()),
    pip: new DependencyParser(new PipParser()),
  } as Record<string, DependencyParser>;

  app.post('/api/dependencies', isAuthorised, (req, res, next) => {
    try {
      const request: ArdoqRequest = req.body;
      const parser: DependencyParser = parsers[request.parser];
      if (parser === undefined) {
        next(new HTTPError('Parser not supported', 400));
      }
      const requestProcessor = new RequestProcessor(client, parser);
      requestProcessor.processRequest(request).then(ardoqResult => {
        res.statusCode = 200;
        if ((ardoqResult.get(ArdoqComponentCreatedStatus.CREATED) ?? 0) > 0) {
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
