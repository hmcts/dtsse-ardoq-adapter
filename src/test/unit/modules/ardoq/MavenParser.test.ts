/* eslint-disable jest/expect-expect */
import { readFileSync } from 'fs';

import { describe, expect, test } from '@jest/globals';

import { MavenParser } from '../../../../main/modules/ardoq/MavenParser';

describe('Ardoq MavenParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/maven-dependencies.log', 'utf-8');

  test('that the raw dependency string is parsed correctly', async () => {
    const res = MavenParser.fromDepString(raw);
    expect(res.size).toBe(118);
  });

  test('that top tier deps are extracted', async () => {
    const res = MavenParser.extractTopTierDeps(raw);
    expect(res[0].getFullName()).toBe('javax:javaee-api 8.0');
    expect(res[1].getFullName()).toBe('uk.gov.justice.framework-api:framework-api-common 11.0.0-M24');
    expect(res[2].getFullName()).toBe('uk.gov.justice.framework-api:framework-api-core 11.0.0-M24');
    expect(res[3].getFullName()).toBe('uk.gov.justice.utils:utilities-core 11.0.0-M24');
  });

  test('error on no tests', async () => {
    try {
      MavenParser.fromDepString('');
    } catch (e) {
      expect(e.message === 'No dependencies found');
    }
  });
});
