import request from 'supertest';
import { describe, expect, jest, it, beforeEach } from '@jest/globals';
import config from 'config';

import { ArdoqComponentCreatedResponse } from '../../../main/modules/ardoq/ArdoqComponentCreatedResponse';

import { RequestProcessor } from '../../../main/modules/ardoq/RequestProcessor';

jest.mock('../../../main/modules/ardoq/RequestProcessor', () => ({
  RequestProcessor: jest.fn().mockImplementation(() => ({
    constructor: (client: ArdoqClient) => {},
    processRequest: (deps: Map<string, Dependency>) =>
      Promise.resolve(
        new Map<ArdoqComponentCreatedResponse, number>([
          [ArdoqComponentCreatedResponse.EXISTING, 10],
          [ArdoqComponentCreatedResponse.CREATED, 0],
          [ArdoqComponentCreatedResponse.ERROR, 0],
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
        ArdoqComponentCreatedResponse.EXISTING +
        '":10,"' +
        ArdoqComponentCreatedResponse.CREATED +
        '":0,"' +
        ArdoqComponentCreatedResponse.ERROR +
        '":0}'
    );
  });

  it('/api/dependencies wrong parser', async () => {
    const bodyContent = JSON.stringify(ardoqRequest(body, 'maven'));
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    // error as sending gradle to maven endpoint
    const res2 = await request(app)
      .post('/api/dependencies')
      .set({
        'Content-Type': 'application/json',
        'Content-Length': bodyLen,
        Authorization: 'Bearer ' + config.get('serverApiKey.primary'),
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(400));
    expect(res2.text).toContain('No dependencies found in request');
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
});
