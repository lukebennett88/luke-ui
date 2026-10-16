import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
	createFileSystemGeneratorCache,
	createGenerator,
	remarkAutoTypeTable,
} from 'fumadocs-typescript';
import type { RemarkAutoTypeTableOptions } from 'fumadocs-typescript';
import * as z from 'zod';
import { createComponentPropsGenerator } from './src/lib/create-component-props-generator.js';
import { inlineExampleSource } from './src/lib/inline-example-source';
import { remarkAttachTypeDefinitions } from './src/lib/remark-attach-type-definitions.js';
import { remarkValidateExamples } from './src/lib/remark-validate-examples';
import { SHIKI_THEMES } from './src/lib/shiki-theme.js';
import { stringifyComponentPropsTable } from './src/lib/stringify-component-props-table.js';

/**
 * Unified merges plugins by function identity and deep-merges their options. Two
 * `[remarkAutoTypeTable, …]` entries therefore collapse into one config, so only the last tag name
 * survives. Distinct attachers keep both `<component-props-table>` and `<auto-type-table>`.
 */
function remarkComponentPropsTable(options?: RemarkAutoTypeTableOptions) {
	return remarkAutoTypeTable(options);
}

function remarkDocsAutoTypeTable(options?: RemarkAutoTypeTableOptions) {
	return remarkAutoTypeTable(options);
}

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

const docsRoot = fileURLToPath(new URL('.', import.meta.url));
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
			[
				remarkComponentPropsTable,
				{
					generator: componentPropsGenerator,
					name: 'component-props-table',
					options: { basePath: repoRoot },
					outputName: 'ComponentPropsTable',
					// Processed Markdown reads GeneratedDoc JSON from the `type` attribute.
					remarkStringify: true,
				} satisfies RemarkAutoTypeTableOptions,
			],
			// After ComponentPropsTable expansion: emit page-level definition assets and strip the
			// registry from the GeneratedDoc JSON so it never reaches search or the props record.
			[remarkAttachTypeDefinitions, { publicDir: resolve(docsRoot, 'public') }],
			[
				remarkDocsAutoTypeTable,
				{
					generator,
					name: 'auto-type-table',
					options: { basePath: repoRoot },
					outputName: 'TypeTable',
				} satisfies RemarkAutoTypeTableOptions,
			],
			remarkValidateExamples,
		],
	},
});
