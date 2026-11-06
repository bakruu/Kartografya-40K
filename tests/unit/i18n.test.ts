import { describe, expect, it } from 'vitest';
import { languages, messages } from '../../src/i18n';

describe('i18n messages', () => {
  it('has the same keys in every language', () => {
    const expected = Object.keys(messages.tr).sort();
    for (const lang of languages) {
      expect(Object.keys(messages[lang]).sort()).toEqual(expected);
    }
  });

  it('has no empty strings', () => {
    for (const lang of languages) {
      for (const value of Object.values(messages[lang])) {
        expect(value.trim()).not.toBe('');
      }
    }
  });
});
