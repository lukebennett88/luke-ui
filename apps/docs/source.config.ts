import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
	remarkAutoTypeTable,
	createGenerator,
	createFileSystemGeneratorCache,
} from 'fumadocs-typescript';

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
	},
});

const generator = createGenerator({
	cache: createFileSystemGeneratorCache('.source/fumadocs-typescript'),
});

export default defineConfig({
	mdxOptions: {
		remarkPlugins: (v) => [...v, [remarkAutoTypeTable, { generator }]],
	},
});
