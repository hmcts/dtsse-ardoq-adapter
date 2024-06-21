import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import config from 'config';
import request from 'supertest';
import * as zlib from 'zlib';

import { ArdoqComponentCreatedStatus } from '../../../main/modules/ardoq/ArdoqComponentCreatedStatus';
import { ArdoqRequest } from '../../../main/modules/ardoq/ArdoqRequest';
import { ArdoqStatusCounts } from '../../../main/modules/ardoq/ArdoqStatusCounts';

import { RequestProcessor } from '../../../main/modules/ardoq/RequestProcessor';

jest.mock('../../../main/modules/ardoq/RequestProcessor', () => ({
  RequestProcessor: jest.fn().mockImplementation(() => ({
    constructor: (client: ArdoqClient) => {},
    processRequest: (request: ArdoqRequest) => {
      if (request.parser === 'maven') {
        return Promise.resolve(new ArdoqStatusCounts().add(ArdoqComponentCreatedStatus.CREATED, 10));
      }
      return Promise.resolve(new ArdoqStatusCounts().add(ArdoqComponentCreatedStatus.EXISTING, 10));
    },
  })),
}));

import fs from 'fs';
import { app } from '../../../main/app';
import { ArdoqClient } from '../../../main/modules/ardoq/ArdoqClient';
import { ardoqRequest } from '../modules/ardoq/TestUtility';

describe('Test api.ts', () => {
  const encodedDependencyList = fs.readFileSync('src/test/resources/gradle-dependencies.log', 'utf8');
  const mavenBody = fs.readFileSync('src/test/resources/maven-dependencies.log', 'utf8');

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
    const bodyContent = JSON.stringify(ardoqRequest({ encodedDependencyList }));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    const res1 = await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': String(bodyLen),
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
        '":0,"' +
        ArdoqComponentCreatedStatus.PENDING +
        '":0}'
    );
  });

  it('/api/dependencies ok created', async () => {
    const bodyContent = JSON.stringify(ardoqRequest({ encodedDependencyList: mavenBody }, 'maven'));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    const res1 = await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': String(bodyLen),
        Authorization: 'Bearer ' + config.get('serverApiKey.primary'),
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(201));

    expect(res1.text).toEqual(
      '{"' +
        ArdoqComponentCreatedStatus.EXISTING +
        '":0,"' +
        ArdoqComponentCreatedStatus.CREATED +
        '":10,"' +
        ArdoqComponentCreatedStatus.ERROR +
        '":0,"' +
        ArdoqComponentCreatedStatus.PENDING +
        '":0}'
    );
  });

  it('/api/dependencies async', async () => {
    const bodyContent = JSON.stringify(ardoqRequest({ encodedDependencyList }));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    await request(app)
      .post('/api/dependencies?async=true')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': String(bodyLen),
        Authorization: 'Bearer ' + config.get('serverApiKey.primary'),
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(202));
  });

  it('/api/dependencies unsupported parser', async () => {
    const bodyContent = JSON.stringify(ardoqRequest({ encodedDependencyList }, 'foo-parser'));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    const res3 = await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': String(bodyLen),
        Authorization: 'Bearer ' + config.get('serverApiKey.secondary'),
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(400));
    expect(res3.body.errors[0].message).toContain('must be equal to one of the allowed values:');
  });

  it('/api/dependencies gzip body', async () => {
    const bodyContent = JSON.stringify(ardoqRequest({ encodedDependencyList }, 'gradle'));
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
        '":0,"' +
        ArdoqComponentCreatedStatus.PENDING +
        '":0}'
    );
  });
});
