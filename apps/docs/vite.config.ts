import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// Rewrites import.meta.url references in story-related files to absolute source
// paths so getStoryPayloads (ts-morph analysis) works when the preview server
// runs from the compiled .output/server directory during static prerendering.
function storySourcePathPlugin(): Plugin {
	return {
		name: 'story-source-path',
		enforce: 'pre',
		transform(code: string, id: string): string | null {
			const cleanId = id.split('?')[0] ?? '';

			// Story files: replace new URL('./foo.story.tsx', import.meta.url)
			if (cleanId.endsWith('.story.tsx')) {
				return code.replace(
					/new URL\(\s*(['"])(\.\.?\/[^'"]+\.story\.tsx)\1\s*,\s*import\.meta\.url\s*\)/g,
					(_, _quote, relativePath: string) => {
						const absolutePath = path.resolve(path.dirname(cleanId), relativePath);
						return JSON.stringify(absolutePath);
					},
				);
			}

			// lib/story.ts: freeze import.meta.url to the source file URL so
			// the derived appRoot (tsconfig + cache paths) is always correct.
			if (cleanId.endsWith('/lib/story.ts')) {
				const sourceUrl = `file://${cleanId.replace(/\\/g, '/')}`;
				return code.replace(/import\.meta\.url/g, JSON.stringify(sourceUrl));
			}

			return null;
		},
	};
}

export default defineConfig(async () => ({
	optimizeDeps: {
		exclude: ['@luke-ui/react'],
	},
	resolve: {
		external: ['ts-morph'],
		tsconfigPaths: true,
	},
	plugins: [
		storySourcePathPlugin(),
		mdx(await import('./source.config')),
		tailwindcss(),
		tanstackStart({
			prerender: {
				enabled: true,
				crawlLinks: true,
			},
			pages: [{ path: '/api/search' }],
		}),
		react(),
		nitro(),
	],
	server: {
		port: 3000,
	},
}));
