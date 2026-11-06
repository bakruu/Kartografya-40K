import en from './en.json';
import tr from './tr.json';

export const languages = ['tr', 'en'] as const;
export type Lang = (typeof languages)[number];

export type MessageKey = keyof typeof tr;

export const messages: Record<Lang, Record<MessageKey, string>> = { tr, en };

export function t(key: MessageKey, lang: Lang): string {
  return messages[lang][key];
}
