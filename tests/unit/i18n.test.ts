import { describe, expect, it } from 'vitest';
import {
  classifications,
  factions,
  riftSides,
  segmentums,
  worldStatuses,
} from '../../src/content/schemas';
import { languages, type MessageKey, messages, t } from '../../src/i18n';

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

  it('translates every value the dossier can show', () => {
    const keys = [
      ...classifications.map((key) => `classification.${key}`),
      ...worldStatuses.map((key) => `status.${key}`),
      ...segmentums.map((key) => `segmentum.${key}`),
      ...factions.map((key) => `faction.${key}`),
      ...riftSides.filter((key) => key !== 'n/a').map((key) => `side.${key}`),
    ];
    for (const key of keys) {
      expect(Object.keys(messages.tr)).toContain(key);
    }
  });
});

describe('t', () => {
  it('returns the string for the requested language', () => {
    const key: MessageKey = 'classification.forge-world';
    expect(t(key, 'tr')).toBe('Dökümhane Dünyası');
    expect(t(key, 'en')).toBe('Forge World');
  });
});
