import { fileURLToPath } from 'node:url';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
	createFileSystemGeneratorCache,
	createGenerator,
	remarkAutoTypeTable,
} from 'fumadocs-typescript';
import * as z from 'zod';
import { remarkValidateExamples } from './src/lib/remark-validate-examples';
import { SHIKI_THEMES } from './src/lib/shiki-theme.js';

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
		schema: pageSchema.extend({
			/**
			 * Type tables to generate onto this component's Props page, in display order. Drives
			 * `scripts/generate-props-pages.ts`.
			 */
			props: z
				.array(
					z.object({
						/** Exported type name to render, e.g. `ButtonProps`. */
						name: z.string(),
						/** Repo-relative path to the file exporting `name`, e.g. `packages/@luke-ui/react/src/button/button.tsx`. */
						path: z.string(),
					}),
				)
				.optional(),
			/** Full URL to this component's React Aria Components docs page, when it genuinely wraps one. */
			reactAria: z.string().optional(),
			/** Repo-relative path to this component's source, e.g. `packages/@luke-ui/react/src/button`. */
			source: z.string().optional(),
		}),
	},
});

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const generator = createGenerator({
	cache: createFileSystemGeneratorCache('.source/fumadocs-typescript'),
});

export default defineConfig({
	mdxOptions: {
		// MDX fences and source modules use the same themes.
		rehypeCodeOptions: {
			themes: SHIKI_THEMES,
		},
		remarkPlugins: (v) => [
			...v,
			[remarkAutoTypeTable, { generator, options: { basePath: repoRoot } }],
			remarkValidateExamples,
		],
	},
});
