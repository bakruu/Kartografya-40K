// Kept apart from content.config.ts because that file imports the `astro:content`
// virtual module, which is not available to unit tests.
import { z } from 'astro/zod';

export const worldLangs = ['tr', 'en'] as const;

export const classifications = [
  'throne-world',
  'forge-world',
  'fortress-world',
  'chapter-homeworld',
] as const;

export const segmentums = [
  'solar',
  'obscurus',
  'pacificus',
  'tempestus',
  'ultima',
  'none',
] as const;

export const worldStatuses = ['active', 'destroyed', 'lost', 'contested', 'warp-rift'] as const;

export const riftSides = ['imperium-sanctus', 'imperium-nihilus', 'n/a'] as const;

const kebabCase = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const worldSchema = z.strictObject({
  slug: kebabCase,
  lang: z.enum(worldLangs),
  name: z.string().min(1),
  classification: z.enum(classifications),
  segmentum: z.enum(segmentums),
  position: z.strictObject({
    // Galactic units (1 unit = 1,000 light years); the galaxy is about 100 units across.
    x: z.number().min(-50).max(50),
    y: z.number().min(-5).max(5),
    z: z.number().min(-50).max(50),
  }),
  eras: z.strictObject({
    m41: z.strictObject({ status: z.enum(worldStatuses) }),
    m42: z.strictObject({ status: z.enum(worldStatuses), side: z.enum(riftSides) }),
  }),
  tags: z.array(kebabCase),
  factions: z.array(kebabCase).min(1),
  sources: z.array(z.string().min(1)).min(1),
  approximate: z.boolean(),
});

export type World = z.infer<typeof worldSchema>;
