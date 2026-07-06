import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { readdir } from 'node:fs/promises';
import type { Plugin } from 'vite-plus';
import { defineConfig, lazyPlugins } from 'vite-plus';

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

const contentDocsDir = fileURLToPath(new URL('./content/docs/', import.meta.url));

async function getMarkdownPrerenderPages(): Promise<Array<{ path: string }>> {
	const files: Array<string> = [];

	async function collect(dir: string): Promise<void> {
		const entries = await readdir(dir, { withFileTypes: true });
		await Promise.all(
			entries.map(async (entry) => {
				const path = join(dir, entry.name);
				if (entry.isDirectory()) return collect(path);
				if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(path);
			}),
		);
	}

	await collect(contentDocsDir);

	return files.map((filePath) => {
		const relativePath = relative(contentDocsDir, filePath).split(sep).join('/');
		const withoutExtension = relativePath.slice(0, -'.mdx'.length);
		return { path: `/docs/${withoutExtension}.md` };
	});
}

export default defineConfig(async () => {
	const markdownPrerenderPages = await getMarkdownPrerenderPages();
	const baseUrl = process.env.VITE_BASE_URL ?? '/';
	// Storybook is copied into <base>/storybook/ by the Pages deploy workflow after this
	// build, so the link crawler must not try to fetch it from the preview server.
	const storybookPath = `${baseUrl.replace(/\/$/, '')}/storybook`;

	return {
		// Allow overriding the base URL for deployments to sub-paths (e.g. GitHub Pages).
		// Set VITE_BASE_URL to the base path with a trailing slash, e.g. /luke-ui/
		base: baseUrl,
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
			ssr: {
				build: {
					rolldownOptions: {
						external: ['env', 'wasi_snapshot_preview1'],
					},
				},
			},
		},
		optimizeDeps: {
			// @luke-ui/react is a workspace package excluded from pre-bundling so its
			// source hot-reloads directly. Its runtime npm dependencies are listed
			// explicitly here so Vite discovers them at cold start instead of lazily
			// when a doc page first renders a component that needs them — a lazy
			// discovery mid-navigation forces a dependency re-optimize + full reload,
			// which corrupts the in-flight React render with an "Invalid hook call".
			exclude: ['@luke-ui/react'],
			include: [
				'@react-aria/utils',
				'@vanilla-extract/recipes',
				'@vanilla-extract/recipes/createRuntimeFn',
				'react-aria-components/Breadcrumbs',
				'react-aria-components/Button',
				'react-aria-components/Collection',
				'react-aria-components/ComboBox',
				'react-aria-components/composeRenderProps',
				'react-aria-components/FieldError',
				'react-aria-components/Form',
				'react-aria-components/Group',
				'react-aria-components/Header',
				'react-aria-components/I18nProvider',
				'react-aria-components/Input',
				'react-aria-components/Label',
				'react-aria-components/Link',
				'react-aria-components/ListBox',
				'react-aria-components/slots',
				'react-aria-components/Text',
				'react-aria-components/TextField',
				'react-aria-components/useAsyncList',
			],
		},
		plugins: lazyPlugins(async () => [
			staticFunctionBasePathPlugin(),
			mdx(await import('./source.config')),
			tailwindcss(),
			tanstackStart({
				pages: [
					{ path: '/api/search' },
					{ path: '/llms.txt' },
					{ path: '/llms-full.txt' },
					...markdownPrerenderPages,
				],
				prerender: {
					crawlLinks: true,
					enabled: true,
					filter: (page) => !page.path.startsWith(storybookPath),
				},
			}),
			react(),
			nitro({
				rolldownConfig: {
					external: ['env', 'wasi_snapshot_preview1'],
					output: {},
				},
			}),
		]),
		resolve: {
			tsconfigPaths: true,
		},
		server: {
			port: 3000,
		},
	};
});
