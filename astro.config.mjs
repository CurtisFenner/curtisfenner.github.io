// @ts-check
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// https://astro.build/config
export default defineConfig({
	site: "https://curtisfenner.com",
	integrations: [
		react(),
		mdx(),
		sitemap(),
	],

	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [() => rehypeKatex({
				trust: (context) => {
					return context.command === "\\htmlClass";
				},
			})],
		}),
	},
	devToolbar: {
		enabled: false
	},
});
