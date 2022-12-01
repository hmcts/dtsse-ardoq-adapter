/* eslint-disable jest/expect-expect */
import { describe, expect, test } from '@jest/globals';

import { Dependency } from '../../../../main/modules/ardoq/Dependency';

describe('Ardoq Dependency', () => {
  test('that the full name is formatted', async () => {
    const d = new Dependency('something:else', '1.1.1');
    expect(d.getFullName()).toBe('something:else 1.1.1');
  });
});
