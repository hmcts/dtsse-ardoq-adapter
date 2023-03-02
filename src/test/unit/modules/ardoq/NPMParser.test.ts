import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { NPMParser } from '../../../../main/modules/ardoq/NPMParser';

describe('Ardoq NPMParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/package-lock.json', 'utf-8');

  const parser = new NPMParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepString(raw);
    expect(res.size).toBe(18);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepString('')).toThrow('Unexpected end of JSON input');
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() => new DependencyParser(parser).fromDepString('hello there!')).toThrow(
      'Unexpected token h in JSON at position 0'
    );
  });
});
