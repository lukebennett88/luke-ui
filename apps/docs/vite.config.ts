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
				let replaced = false;
				const result = code.replace(
					/new URL\(\s*(['"])(\.\.?\/[^'"]+\.story\.tsx)\1\s*,\s*import\.meta\.url\s*\)/g,
					(_, _quote, relativePath: string) => {
						replaced = true;
						const absolutePath = path.resolve(path.dirname(cleanId), relativePath);
						return JSON.stringify(absolutePath);
					},
				);
				if (!replaced) {
					throw new Error(
						`[story-source-path] ${cleanId} has no 'new URL("./name.story.tsx", import.meta.url)' literal. ` +
							`This call is required so ts-morph can resolve the source file during prerendering.`,
					);
				}
				return result;
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
	// Allow overriding the base URL for deployments to sub-paths (e.g. GitHub Pages).
	// Set VITE_BASE_URL to the base path with a trailing slash, e.g. /luke-ui/
	base: process.env.VITE_BASE_URL ?? '/',
	// Tell TanStack Start's plugin where the client output lives so it bakes the
	// correct TSS_CLIENT_OUTPUT_DIR into the server bundle. Nitro's
	// configEnvironment hook sets the resolved client env outDir to
	// .output/public independently, but TSS_CLIENT_OUTPUT_DIR is frozen at
	// build time from the *user* config before Nitro runs — without this,
	// staticFunctionMiddleware writes __tsr cache files to dist/client/ instead
	// of .output/public/, requiring a postbuild cp -r to fix it up.
	environments: {
		client: {
			build: {
				// TSS_CLIENT_OUTPUT_DIR is baked into the server bundle at build time
				// from the user config (before Nitro overrides the resolved outDir).
				// The preview server that runs during prerendering has CWD = .output/,
				// so this value must be relative to .output/ — "public" resolves to
				// .output/public, which is where staticFunctionMiddleware should write
				// __tsr cache files. Nitro's configEnvironment hook overrides the
				// actual build outDir to its own .output/public path independently.
				outDir: 'public',
			},
		},
	},
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
