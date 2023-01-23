/* eslint-disable jest/expect-expect */
import { readFileSync } from 'fs';

import { describe, expect, test } from '@jest/globals';

import { GradleParser } from '../../../../main/modules/ardoq/GradleParser';

describe('Ardoq GradleParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/gradle-dependencies.log', 'utf-8');

  const parser = new GradleParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = parser.fromDepString(raw);
    expect(res.size).toBe(93);
  });

  test('that top tier deps are extracted', async () => {
    const res = parser.extractTopTierDeps(raw);
    expect(res[0].getFullName()).toBe('org.springframework.boot:spring-boot-starter-web 2.7.2');
    expect(res[1].getFullName()).toBe('org.springframework.boot:spring-boot-starter-actuator 2.7.2');
    expect(res[2].getFullName()).toBe('org.springframework.boot:spring-boot-starter-aop 2.7.2');
    expect(res[3].getFullName()).toBe('org.springframework.boot:spring-boot-starter-json 2.7.2');
  });

  test('error on no tests', async () => {
    try {
      parser.fromDepString('');
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
