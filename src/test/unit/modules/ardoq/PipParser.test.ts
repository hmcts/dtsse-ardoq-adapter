import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { PipParser } from '../../../../main/modules/ardoq/PipParser';

describe('Ardoq PipParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/requirements.txt', 'utf-8');

  const parser = new PipParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepString(raw);
    expect(res.size).toBe(3);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepString('')).toThrow('No dependencies found in request');
  });

  test('that an error is thrown for invalid txt', async () => {
    expect(() => new DependencyParser(parser).fromDepString('hello there!')).toThrow(
      'No dependencies found in request'
    );
  });
});
