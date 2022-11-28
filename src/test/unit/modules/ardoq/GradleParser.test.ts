/* eslint-disable jest/expect-expect */
import { readFileSync } from 'fs';

import { describe, expect, test } from '@jest/globals';

import { GradleParser } from '../../../../main/modules/ardoq/GradleParser';

describe('Ardoq GradleParser', () => {
  const raw = readFileSync('./src/test/resources/gradle-dependencies.log', 'utf-8');

  test('that the raw dependency string is parsed correctly', async () => {
    const res = GradleParser.fromDepString(raw);
    expect(res.size).toBe(93);
  });

  test('that top tier deps are extracted', async () => {
    const res = GradleParser.extractTopTierDeps(raw);
    expect(res[0]).toBe('org.springframework.boot:spring-boot-starter-web -> 2.7.2');
    expect(res[1]).toBe('org.springframework.boot:spring-boot-starter-actuator -> 2.7.2');
    expect(res[2]).toBe('org.springframework.boot:spring-boot-starter-aop -> 2.7.2');
    expect(res[3]).toBe('org.springframework.boot:spring-boot-starter-json -> 2.7.2');
  });
});
