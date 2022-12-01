import * as fs from 'fs';
import * as zlib from 'zlib';

import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('maven dependencies', () => {
  describe('on POST', () => {
    test('should return 200 OK', async () => {
      const body = fs.readFileSync('src/test/resources/maven-dependencies.log', 'utf8');

      const objBuf = Buffer.from(body, 'utf-8');
      const bodyContent = zlib.gzipSync(objBuf);
      const bodyLen = Buffer.byteLength(bodyContent, 'utf-8');

      await request(app)
        .post('/api/gradle/send-letter-service')
        .set({
          'Content-Type': 'text/plain',
          'Content-Encoding': 'gzip',
          'Content-Length': bodyLen,
          'Accept-Encoding': 'gzip',
        })
        .send(bodyContent)
        .expect(res => expect(res.status).to.equal(200))
        .expect(res => expect(res.body).to.equal(200));
    });
  });
});
