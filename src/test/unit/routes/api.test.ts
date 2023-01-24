import request from 'supertest';
import { describe, expect, jest, it, beforeEach } from '@jest/globals';
import express from 'express';

import { ArdoqComponentCreatedResponse } from '../../../main/modules/ardoq/ArdoqComponentCreatedResponse';

import { RequestProcessor } from '../../../main/modules/ardoq/RequestProcessor';

jest.mock('../../../main/modules/ardoq/RequestProcessor', () => ({
  RequestProcessor: jest.fn().mockImplementation(() => ({
    constructor: (client: ArdoqClient) => {},
    processRequest: (res: express.Response, deps: Map<string, Dependency>) =>
      Promise.resolve(
        res
          .status(200)
          .send(
            '{"' +
              ArdoqComponentCreatedResponse.EXISTING +
              '":10,"' +
              ArdoqComponentCreatedResponse.CREATED +
              '":0,"' +
              ArdoqComponentCreatedResponse.ERROR +
              '":0}'
          )
      ),
  })),
}));

import { app } from '../../../main/app';
import fs from 'fs';
import { Dependency } from '../../../main/modules/ardoq/Dependency';
import { ArdoqClient } from '../../../main/modules/ardoq/ArdoqClient';

describe('Test api.ts', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (RequestProcessor as jest.Mock).mockClear();
  });

  it('/api/gradle/foo-app', async () => {
    const body = fs.readFileSync('src/test/resources/gradle-dependencies.log', 'utf8');

    const bodyContent = Buffer.from(body, 'utf-8').toString('base64');
    const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

    const res1 = await request(app)
      .post('/api/gradle/foo-app')
      .set({
        'Content-Type': 'text/plain',
        'Content-Length': bodyLen,
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

    // error as sending gradle to maven endpoint
    const res2 = await request(app)
      .post('/api/maven/foo-app')
      .set({
        'Content-Type': 'text/plain',
        'Content-Length': bodyLen,
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(400));
    expect(res2.text).toContain('No dependencies found in request');

    const res3 = await request(app)
      .post('/api/fake-parser/foo-app')
      .set({
        'Content-Type': 'text/plain',
        'Content-Length': bodyLen,
      })
      .send(bodyContent)
      .expect(res => expect(res.status).toEqual(400));
    expect(res3.text).toContain('Error: Parser not supported');
  });
});
