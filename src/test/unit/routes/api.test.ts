import request from 'supertest';
import { describe, expect, jest, it, beforeEach } from '@jest/globals';
import config from 'config';
import * as zlib from 'zlib';

import { ArdoqComponentCreatedStatus } from '../../../main/modules/ardoq/ArdoqComponentCreatedStatus';

import { RequestProcessor } from '../../../main/modules/ardoq/RequestProcessor';

jest.mock('../../../main/modules/ardoq/RequestProcessor', () => ({
  RequestProcessor: jest.fn().mockImplementation(() => ({
    constructor: (client: ArdoqClient) => {},
    processRequest: (deps: Map<string, Dependency>) =>
      Promise.resolve(
        new Map<ArdoqComponentCreatedStatus, number>([
          [ArdoqComponentCreatedStatus.EXISTING, 10],
          [ArdoqComponentCreatedStatus.CREATED, 0],
          [ArdoqComponentCreatedStatus.ERROR, 0],
        ])
      ),
  })),
}));

import { app } from '../../../main/app';
import fs from 'fs';
import { Dependency } from '../../../main/modules/ardoq/Dependency';
import { ArdoqClient } from '../../../main/modules/ardoq/ArdoqClient';
import { ardoqRequest } from '../modules/ardoq/TestUtility';

describe('Test api.ts', () => {
  const body = fs.readFileSync('src/test/resources/gradle-dependencies.log', 'utf8');

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (RequestProcessor as jest.Mock).mockClear();
  });

  it('should return 401', async () => {
    await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
      })
      .expect(res => expect(res.status).toEqual(401));
  });

  it('/api/dependencies ok', async () => {
    const bodyContent = JSON.stringify(ardoqRequest(body));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    const res1 = await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': bodyLen,
        Authorization: 'Bearer ' + config.get('serverApiKey.primary'),
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(200));

    expect(res1.text).toEqual(
      '{"' +
        ArdoqComponentCreatedStatus.EXISTING +
        '":10,"' +
        ArdoqComponentCreatedStatus.CREATED +
        '":0,"' +
        ArdoqComponentCreatedStatus.ERROR +
        '":0}'
    );
  });

  it('/api/dependencies unsupported parser', async () => {
    const bodyContent = JSON.stringify(ardoqRequest(body, 'foo-parser'));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    const res3 = await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': bodyLen,
        Authorization: 'Bearer ' + config.get('serverApiKey.secondary'),
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(400));
    expect(res3.body.errors[0].message).toContain('must be equal to one of the allowed values:');
  });

  it('/api/dependencies gzip body', async () => {
    const bodyContent = JSON.stringify(ardoqRequest(body, 'gradle'));
    const gzipBody = zlib.gzipSync(bodyContent);

    const req = request(app).post('/api/dependencies');
    req.set({
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + config.get('serverApiKey.primary'),
    });
    req.write(gzipBody);
    const res = await req;
    expect(res.status).toEqual(200);
    expect(res.text).toEqual(
      '{"' +
        ArdoqComponentCreatedStatus.EXISTING +
        '":10,"' +
        ArdoqComponentCreatedStatus.CREATED +
        '":0,"' +
        ArdoqComponentCreatedStatus.ERROR +
        '":0}'
    );
  });
});
