import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { NPMParser } from '../../../../main/modules/ardoq/NPMParser';

describe('Ardoq NPMParser', () => {
  const raw = readFileSync(__dirname + '/../../../resources/package-lock.json', 'utf-8');
  const rawV1 = readFileSync(__dirname + '/../../../resources/package-lock-v1.json', 'utf-8');

  const parser = new NPMParser();

  test('that the raw dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(raw);
    expect(res.size).toBe(18);
  });

  test('that the raw v1 dependency string is parsed correctly', async () => {
    const res = new DependencyParser(parser).fromDepRequest(rawV1);
    expect(res.size).toBe(7);
  });

  test('that an error is thrown for empty files', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest('')).toThrow('Unexpected end of JSON input');
  });

  test('that an error is thrown for invalid yaml', async () => {
    expect(() => new DependencyParser(parser).fromDepRequest('hello there!')).toThrow(
      'Unexpected token h in JSON at position 0'
    );
  });
});
