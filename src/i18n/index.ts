import en from './en.json';
import tr from './tr.json';

// Phase 1 adds the type-safe t(key, lang) helper on top of this.
export const languages = ['tr', 'en'] as const;
export type Lang = (typeof languages)[number];

export const messages: Record<Lang, typeof tr> = { tr, en };
