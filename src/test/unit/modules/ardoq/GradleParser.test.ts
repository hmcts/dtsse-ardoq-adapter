/* eslint-disable jest/expect-expect */
import { readFileSync } from 'fs';

import { describe, expect, test } from '@jest/globals';

import { GradleParser } from '../../../../main/modules/ardoq/GradleParser';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq GradleParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/gradle-dependencies.log', 'utf-8');

  const parser = new GradleParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(ardoqRequest(raw));
    expect(res.size).toBe(3);
  });

  test('that top tier deps are extracted', async () => {
    const res = parser.extractTopTierDeps(raw);
    expect(res[0].name).toBe('org.springframework.boot:spring-boot-starter-web');
    expect(res[1].name).toBe('org.springframework.boot:spring-boot-starter-actuator');
    expect(res[2].name).toBe('org.springframework.boot:spring-boot-starter-aop');
  });

  test('error on no tests', async () => {
    try {
      new DependencyParser(parser).fromDepRequest(ardoqRequest(''));
    } catch (e) {
      expect(e.message === 'No dependencies found');
    }
  });

  test('error on malformed dep string', async () => {
    try {
      parser.getDependency('boop');
    } catch (e) {
      expect(e.message === 'Dependency string boop is malformed. Should match <name> -> <version>');
    }
  });
});
