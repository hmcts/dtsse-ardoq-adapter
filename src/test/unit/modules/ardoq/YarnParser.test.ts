import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { YarnParser } from '../../../../main/modules/ardoq/YarnParser';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';

describe('Ardoq YarnParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/yarn.lock', 'utf-8');

  const parser = new YarnParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepString(raw);
    expect(res.size).toBe(21);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepString('')).toThrow('No dependencies found');
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() => new DependencyParser(parser).fromDepString('{"json": "data"}')).toThrow(
      'No dependencies found in request'
    );
  });
});
