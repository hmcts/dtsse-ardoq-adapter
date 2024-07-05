import { readFileSync } from 'fs';

import { describe, expect, test } from '@jest/globals';

import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { MavenParser } from '../../../../main/modules/ardoq/MavenParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq MavenParser', () => {
  const encodedDependencyList = readFileSync(__dirname + '/../../../resources/maven-dependencies.log', 'utf-8');

  const parser = new MavenParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = await new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList }, 'maven'));
    expect(Object.keys(res).length).toBe(116);
  });

  test('that top tier deps are extracted', async () => {
    const res = await parser.extractTopTierDeps(encodedDependencyList);
    expect(res[0].name).toBe('javax:javaee-api');
    expect(res[1].name).toBe('uk.gov.justice.framework-api:framework-api-common');
    expect(res[2].name).toBe('uk.gov.justice.framework-api:framework-api-core');
    expect(res[3].name).toBe('uk.gov.justice.utils:utilities-core');
  });

  test('error on no tests', async () => {
    try {
      await new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList }, 'maven'));
    } catch (e) {
      expect(e.message === 'No dependencies found');
    }
  });
});
