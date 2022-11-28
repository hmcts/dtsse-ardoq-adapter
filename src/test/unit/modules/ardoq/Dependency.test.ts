/* eslint-disable jest/expect-expect */
import { describe, expect, test } from '@jest/globals';

import { Dependency } from '../../../../main/modules/ardoq/Dependency';

describe('Ardoq Dependency', () => {
  test('that dependency string is parsed correctly', async () => {
    const d = Dependency.fromDepString('something:else -> 1.1.1');
    expect(d.name).toBe('something:else');
    expect(d.version).toBe('1.1.1');
  });

  test('that the full name is formatted', async () => {
    const d = Dependency.fromDepString('something:else -> 1.1.1');
    expect(d.getFullName()).toBe('something:else 1.1.1');
  });
});
