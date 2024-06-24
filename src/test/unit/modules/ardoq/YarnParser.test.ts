import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { YarnParser } from '../../../../main/modules/ardoq/YarnParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq YarnParser', () => {
  const encodedDependencyList = readFileSync(__dirname + '/../../../resources/yarn.lock', 'utf-8');
  const encodedDependencyListOther = readFileSync(__dirname + '/../../../resources/package.json', 'utf-8');

  const parser = new YarnParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = await new DependencyParser(parser).fromDepRequest(
      ardoqRequest({ encodedDependencyList, encodedDependencyListOther })
    );
    expect(Object.keys(res).length).toBe(44);
  });

  test('that an error is thrown for empty files', async () => {
    await expect(
      new DependencyParser(parser).fromDepRequest(
        ardoqRequest({ encodedDependencyList: '', encodedDependencyListOther: '{}' })
      )
    ).rejects.toThrow();
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() =>
      new DependencyParser(parser).fromDepRequest(
        ardoqRequest({ encodedDependencyList: '{"json": "data"}', encodedDependencyListOther: '{}' })
      )
    ).rejects.toThrow('No dependencies found in request (found: 0)');
  });
});
