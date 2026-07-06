import { fileURLToPath } from 'node:url';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
	createFileSystemGeneratorCache,
	createGenerator,
	remarkAutoTypeTable,
} from 'fumadocs-typescript';
import { remarkValidateExamples } from './src/lib/remark-validate-examples';

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
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
