import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { YarnParser } from '../../../../main/modules/ardoq/YarnParser';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { ardoqRequest } from './TestUtility';

describe('Ardoq YarnParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/yarn.lock', 'utf-8');

  const parser = new YarnParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(ardoqRequest(raw));
    expect(Object.keys(res).length).toBe(21);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest(ardoqRequest(''))).toThrow('No dependencies found');
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest(ardoqRequest('{"json": "data"}'))).toThrow(
      'No dependencies found in request'
    );
  });
});
