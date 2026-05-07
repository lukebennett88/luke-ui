import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// Freezes `import.meta.url` to the source file URL in story files and lib/story.ts.
// At runtime the preview server runs from the compiled .output/server directory,
// but ts-morph (via getStoryPayloads) and lib/story.ts's appRoot calculation need
// the original source paths.
function storySourcePathPlugin(): Plugin {
	return {
		name: 'story-source-path',
		enforce: 'pre',
		transform(code, id) {
			const cleanId = id.split('?')[0] ?? '';
			if (!cleanId.endsWith('.story.tsx') && !cleanId.endsWith('/lib/story.ts')) return null;
			if (!code.includes('import.meta.url')) return null;
			const sourceUrl = `file://${cleanId.replace(/\\/g, '/')}`;
			return code.replace(/\bimport\.meta\.url\b/g, JSON.stringify(sourceUrl));
		},
	};
}

// staticFunctionMiddleware hardcodes `/__tsr/staticServerFnCache/...` for the
// client fetch URL with no base-path support. When deployed under a sub-path
// (e.g. GitHub Pages /luke-ui/), the client requests /__tsr/... and 404s.
// This patches only the client fetch so the on-disk layout stays unchanged.
function staticFunctionBasePathPlugin(): Plugin {
	return {
		name: 'static-function-base-path',
		transform(code, id) {
			if (!id.includes('start-static-server-functions')) return null;
			if (!id.endsWith('staticFunctionMiddleware.js')) return null;
			if (!code.includes('fetch(url,')) return null;
			return code.replace(
				'fetch(url,',
				"fetch(import.meta.env.BASE_URL.replace(/\\/$/, '') + url,",
			);
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
		staticFunctionBasePathPlugin(),
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
