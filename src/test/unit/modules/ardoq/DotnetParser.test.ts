import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { DotnetParser } from '../../../../main/modules/ardoq/DotnetParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq DotnetParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/dotnet.json', 'utf-8');
  const parser = new DotnetParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = await new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList: raw }));
    expect(Object.keys(res).length).toBe(2);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() =>
      new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList: '' }))
    ).rejects.toThrow();
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() =>
      new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList: 'hello there!' }))
    ).rejects.toThrow();
  });
});
