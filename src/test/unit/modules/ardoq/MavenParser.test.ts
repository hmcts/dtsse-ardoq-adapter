/* eslint-disable jest/expect-expect */
import { readFileSync } from 'fs';

import { describe, expect, test } from '@jest/globals';

import { MavenParser } from '../../../../main/modules/ardoq/MavenParser';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq MavenParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/maven-dependencies.log', 'utf-8');

  const parser = new MavenParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(ardoqRequest(raw, 'maven'));
    expect(res.size).toBe(116);
  });

  test('that top tier deps are extracted', async () => {
    const res = parser.extractTopTierDeps(raw);
    expect(res[0].name).toBe('javax:javaee-api');
    expect(res[1].name).toBe('uk.gov.justice.framework-api:framework-api-common');
    expect(res[2].name).toBe('uk.gov.justice.framework-api:framework-api-core');
    expect(res[3].name).toBe('uk.gov.justice.utils:utilities-core');
  });

  test('error on no tests', async () => {
    try {
      new DependencyParser(parser).fromDepRequest(ardoqRequest(raw, 'maven'));
    } catch (e) {
      expect(e.message === 'No dependencies found');
    }
  });
});
