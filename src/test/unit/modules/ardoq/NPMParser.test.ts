import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { NPMParser } from '../../../../main/modules/ardoq/NPMParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq NPMParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/package-lock.json', 'utf-8');
  const rawV1 = readFileSync(__dirname + '/../../../resources/package-lock-v1.json', 'utf-8');

  const parser = new NPMParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(ardoqRequest(raw));
    expect(Object.keys(res).length).toBe(18);
  });

  test('that the raw v1 dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(ardoqRequest(rawV1));
    expect(Object.keys(res).length).toBe(7);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest(ardoqRequest(''))).toThrow('Unexpected end of JSON input');
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest(ardoqRequest('hello there!'))).toThrow();
  });
});
