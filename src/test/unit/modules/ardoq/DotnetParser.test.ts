import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DotnetParser } from '../../../../main/modules/ardoq/DotnetParser';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq DotnetParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/dotnet.json', 'utf-8');
  const parser = new DotnetParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(ardoqRequest(raw));
    expect(res.size).toBe(2);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest(ardoqRequest(''))).toThrow('Unexpected end of JSON input');
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest(ardoqRequest('hello there!'))).toThrow(
      'Unexpected token h in JSON at position 0'
    );
  });
});
