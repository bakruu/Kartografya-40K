import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { type World, worldLangs, worldSchema } from '../../src/content/schemas';

const worldsDir = join(process.cwd(), 'src/content/worlds');
const maxSummaryWords = 250;

interface WorldFile {
  fileName: string;
  frontmatter: unknown;
  body: string;
}

function readWorldFiles(): WorldFile[] {
  return readdirSync(worldsDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const source = readFileSync(join(worldsDir, fileName), 'utf8');
      const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) throw new Error(`${fileName} has no frontmatter block`);
      return { fileName, frontmatter: parse(match[1] ?? ''), body: match[2] ?? '' };
    });
}

const files = readWorldFiles();

function parsedWorlds(): { fileName: string; world: World }[] {
  return files.map(({ fileName, frontmatter }) => ({
    fileName,
    world: worldSchema.parse(frontmatter),
  }));
}

describe('world files', () => {
  it('exist', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('$fileName matches the schema', ({ frontmatter }) => {
    expect(worldSchema.safeParse(frontmatter).error).toBeUndefined();
  });

  it('are named <slug>.<lang>.md', () => {
    for (const { fileName, world } of parsedWorlds()) {
      expect(fileName).toBe(`${world.slug}.${world.lang}.md`);
    }
  });

  it.each(files)('$fileName has a summary within the word limit', ({ body }) => {
    const words = body.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThan(0);
    expect(words.length).toBeLessThanOrEqual(maxSummaryWords);
  });

  it('exist in every language for every slug', () => {
    const langsBySlug = Map.groupBy(parsedWorlds(), ({ world }) => world.slug);
    for (const [slug, entries] of langsBySlug) {
      const langs = entries.map(({ world }) => world.lang).sort();
      expect(langs, slug).toEqual([...worldLangs].sort());
    }
  });

  it('share everything except lang across languages', () => {
    const entriesBySlug = Map.groupBy(parsedWorlds(), ({ world }) => world.slug);
    for (const [slug, entries] of entriesBySlug) {
      const [first, ...rest] = entries.map(({ world: { lang: _lang, ...shared } }) => shared);
      for (const other of rest) {
        expect(other, slug).toEqual(first);
      }
    }
  });
});

describe('worldSchema', () => {
  const valid = {
    slug: 'test-world',
    lang: 'tr',
    name: 'Test World',
    classification: 'forge-world',
    segmentum: 'solar',
    position: { x: 1, y: 0, z: -1 },
    eras: {
      m41: { status: 'active' },
      m42: { status: 'lost', side: 'n/a' },
    },
    tags: [],
    factions: ['imperium'],
    sources: ['A book'],
    approximate: true,
  };

  it('accepts a valid world', () => {
    expect(worldSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['an unknown language', { lang: 'de' }],
    ['an unknown classification', { classification: 'moon' }],
    ['an unknown segmentum', { segmentum: 'nowhere' }],
    ['a slug that is not kebab-case', { slug: 'Test World' }],
    ['a position outside the galaxy', { position: { x: 51, y: 0, z: 0 } }],
    ['an unknown status', { eras: { m41: { status: 'fine' }, m42: valid.eras.m42 } }],
    ['an M42 era without a side', { eras: { m41: valid.eras.m41, m42: { status: 'active' } } }],
    ['an unknown faction', { factions: ['squats'] }],
    ['no sources', { sources: [] }],
    ['an unknown field', { typo: true }],
  ])('rejects %s', (_label, change) => {
    expect(worldSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});
