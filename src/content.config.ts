import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		published: z.string(),
		/** The path to use for top-level pages.
		 * Otherwise, served at `/blog/<slug>`.
		 *
		 * See `postUrl` function */
		topSlug: z.coerce.string().optional(),
		/** If set, a "project" post which should appear on the front page. */
		project: z.string().optional(),
	}),
});

export const collections = { blog };
