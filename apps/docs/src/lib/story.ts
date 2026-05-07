import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemCache, defineStoryFactory } from '@fumadocs/story';

// Resolved at build time by storySourcePathPlugin — points to apps/docs/
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const { defineStory, getStoryPayloads } = defineStoryFactory({
	cache:
		process.env.NODE_ENV === 'production'
			? createFileSystemCache(path.join(appRoot, '.story/cache'))
			: undefined,
	tsc: { tsconfigPath: path.join(appRoot, 'tsconfig.json') },
});
