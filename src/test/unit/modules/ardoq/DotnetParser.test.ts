import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DotnetParser } from '../../../../main/modules/ardoq/DotnetParser';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';

describe('Ardoq DotnetParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/dotnet.json', 'utf-8');

  const parser = new DotnetParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepString(raw);
    expect(res.size).toBe(2);
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
