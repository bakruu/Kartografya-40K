import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { worldSchema } from './content/schemas';

const worlds = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/worlds',
    // The default id is the `slug` field, which is shared by both language files of a world.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: worldSchema,
});

export const collections = { worlds };
