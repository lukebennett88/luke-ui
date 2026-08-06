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

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
		schema: pageSchema.extend({
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
		remarkPlugins: (v) => [
			...v,
			[remarkAutoTypeTable, { generator, options: { basePath: repoRoot } }],
			remarkValidateExamples,
		],
	},
});
