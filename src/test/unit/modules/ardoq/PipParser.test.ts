import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { PipParser } from '../../../../main/modules/ardoq/PipParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq PipParser', () => {
  const encodedDependencyList = readFileSync(__dirname + '/../../../resources/requirements.txt', 'utf-8');

  const parser = new PipParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = await new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList }));
    expect(Object.keys(res).length).toBe(3);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() =>
      new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList: '' }))
    ).rejects.toThrow('No dependencies found in request (found: 0)');
  });

  test('that an error is thrown for invalid txt', async () => {
    expect(() =>
      new DependencyParser(parser).fromDepRequest(ardoqRequest({ encodedDependencyList: 'hello there!' }))
    ).rejects.toThrow('No dependencies found in request (found: 0)');
  });
});
