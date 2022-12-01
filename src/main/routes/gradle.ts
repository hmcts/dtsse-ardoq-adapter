import config from 'config';
import { Application } from 'express';

import { ArdoqClient } from '../modules/ardoq/ArdoqClient';
import { ArdoqComponentCreatedResponse } from '../modules/ardoq/ArdoqComponentCreatedResponse';
import { Dependency } from '../modules/ardoq/Dependency';
import { GradleParser } from '../modules/ardoq/GradleParser';

export default function (app: Application): void {
  app.post('/api/gradle/:repo', async (req, res) => {
    // console.log('Repo: ' + req.params.repo);

    try {
      const deps: Map<string, Dependency> = GradleParser.fromDepString(String(req.body));
      const client = new ArdoqClient(
        config.get('ardoq.apiKey'),
        config.get('ardoq.apiUrl'),
        config.get('ardoq.apiWorkspace')
      );

      const depUpdate: Promise<ArdoqComponentCreatedResponse>[] = [];
      deps.forEach((d: Dependency) => {
        depUpdate.push(client.updateDep(d));
      });

      await Promise.all(depUpdate).then(up => {
        const counts: Map<ArdoqComponentCreatedResponse, number> = new Map<ArdoqComponentCreatedResponse, number>([
          [ArdoqComponentCreatedResponse.EXISTING, 0],
          [ArdoqComponentCreatedResponse.CREATED, 0],
          [ArdoqComponentCreatedResponse.ERROR, 0],
        ]);
        up.forEach(response => counts.set(response, 1 + (counts.get(response) ?? 0)));

        res.statusCode = 200;
        if ((counts.get(ArdoqComponentCreatedResponse.CREATED) ?? 0) > 0) {
          res.statusCode = 201;
        }
        res.contentType('application/javascript');
        res.send(JSON.stringify(Object.fromEntries(counts)));
      });
    } catch (e) {
      res.statusCode = 400;
      res.contentType('text/plain');
      res.send(e.message);
    }
  });
}
