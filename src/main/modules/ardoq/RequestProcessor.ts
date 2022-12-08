import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedResponse } from './ArdoqComponentCreatedResponse';
import { Dependency } from './Dependency';

import express from 'express';

export class RequestProcessor {
  client: ArdoqClient;

  constructor(client: ArdoqClient) {
    this.client = client;
  }

  public async processRequest(res: express.Response, deps: Map<string, Dependency>): Promise<void> {
    try {
      const depUpdate: Promise<ArdoqComponentCreatedResponse>[] = [];
      deps.forEach((d: Dependency) => {
        depUpdate.push(this.client.updateDep(d));
      });

      const up = await Promise.all(depUpdate);
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
    } catch (e) {
      res.statusCode = 400;
      res.contentType('text/plain');
      res.send(e.message);
    }
  }
}
