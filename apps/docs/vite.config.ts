import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import netlify from '@netlify/vite-plugin-tanstack-start';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
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

// Search and LLM endpoints are static docs artifacts; preview is explicit because iframe sources aren't link-crawled.
export const staticPrerenderPages = [
	{ path: '/api/search' },
	{ path: '/llms.txt' },
	{ path: '/llms-full.txt' },
	{ path: '/playground/preview' },
];

export function getPrerenderOptions(storybookPath: string) {
	return {
		crawlLinks: true,
		// The generated preview server is unreliable under Netlify's default
		// parallelism, so serialize its requests.
		concurrency: 1,
		enabled: true,
		filter: (page: { path: string }) => !page.path.startsWith(storybookPath),
		retryCount: 2,
	};
}

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
		return { path: `/${withoutExtension}.md` };
	});
}

export default defineConfig(async () => {
	const markdownPrerenderPages = await getMarkdownPrerenderPages();
	const baseUrl = process.env.VITE_BASE_URL ?? '/';
	const storybookPath = `${baseUrl.replace(/\/$/, '')}/storybook`;

	return {
		// Allow overriding the base URL for deployments to sub-paths (e.g. GitHub Pages).
		// Set VITE_BASE_URL to the base path with a trailing slash, e.g. /luke-ui/
		base: baseUrl,
		environments: {
			ssr: {
				build: {
					rolldownOptions: {
						external: ['env', 'wasi_snapshot_preview1'],
					},
				},
			},
		},
		// `vp pack` compiles the pre-hydration skeleton script to an inline-able
		// IIFE artifact; it runs as part of `docs#generate`, not `vp build`.
		pack: {
			clean: false,
			dts: false,
			// Emitted as src/generated/editor-skeleton-script.iife.js — the `.iife`
			// suffix is fixed by tsdown for this format.
			entry: ['src/components/playground/editor-skeleton-script.ts'],
			format: 'iife' as const,
			// The artifact is inlined into every playground HTML response, so
			// strip the source's documentation comments.
			minify: true,
			outDir: 'src/generated',
			platform: 'browser' as const,
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
				'@monaco-editor/react',
				'@react-aria/utils',
				'@vanilla-extract/recipes',
				'@vanilla-extract/recipes/createRuntimeFn',
				'lz-string',
				'monaco-editor',
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
				'sucrase',
			],
		},
		plugins: lazyPlugins(async () => [
			staticFunctionBasePathPlugin(),
			mdx(await import('./source.config')),
			tailwindcss(),
			tanstackStart({
				pages: [...staticPrerenderPages, ...markdownPrerenderPages],
				prerender: getPrerenderOptions(storybookPath),
			}),
			react(),
			netlify(),
		]),
		resolve: {
			tsconfigPaths: true,
		},
		server: {
			port: 3000,
		},
	};
});
