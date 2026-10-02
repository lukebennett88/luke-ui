import { fileURLToPath } from 'node:url';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
	createFileSystemGeneratorCache,
	createGenerator,
	remarkAutoTypeTable,
} from 'fumadocs-typescript';
import * as z from 'zod';
import { createComponentPropsGenerator } from './src/lib/create-component-props-generator.js';
import { inlineExampleSource } from './src/lib/inline-example-source';
import { remarkValidateExamples } from './src/lib/remark-validate-examples';
import { SHIKI_THEMES } from './src/lib/shiki-theme.js';
import { stringifyComponentPropsTable } from './src/lib/stringify-component-props-table.js';

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		postprocess: {
			includeProcessedMarkdown: {
				stringify: (node) => inlineExampleSource(node) ?? stringifyComponentPropsTable(node),
			},
		},
		schema: pageSchema.extend({
			/**
			 * Which page-action links to show. `edit` keeps only Edit on GitHub on generated indexes,
			 * hiding React Aria, Source, and Markdown actions.
			 */
			pageActions: z.enum(['all', 'edit']).optional(),
			/** Full URL to this component's React Aria Components docs page, when it genuinely wraps one. */
			reactAria: z.string().optional(),
			/** Repo-relative path to this component's public module, e.g. `packages/@luke-ui/react/src/exports/button.ts`. */
			source: z.string().optional(),
		}),
	},
});

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const generator = createGenerator({
	cache: createFileSystemGeneratorCache('.source/fumadocs-typescript'),
});

const componentPropsGenerator = createComponentPropsGenerator({
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
			[
				remarkAutoTypeTable,
				{
					generator: componentPropsGenerator,
					name: 'component-props-table',
					options: { basePath: repoRoot },
					outputName: 'ComponentPropsTable',
					// Processed Markdown reads GeneratedDoc JSON from the `type` attribute.
					remarkStringify: true,
				},
			],
			remarkValidateExamples,
		],
	},
});
