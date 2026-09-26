import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import netlify from '@netlify/vite-plugin-tanstack-start';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import type { Plugin } from 'vite-plus';
import { defineConfig, lazyPlugins } from 'vite-plus';
import { isDocsStaticDeploy } from './src/lib/docs-deploy-mode.js';
import { findMdxFiles } from './src/lib/docs-mdx-files.js';
import { highlightSourcePlugin } from './src/lib/highlight-source-plugin.js';
import { getMarkdownPagePath } from './src/lib/markdown-page-path.js';

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

const TRAILING_SLASH_PATTERN = /\/$/;

// The dev server's origin, used when `SITE_URL` is unset.
const LOCAL_SITE_URL = 'http://localhost:3000';

const contentDocsDir = fileURLToPath(new URL('./content/docs/', import.meta.url));

function getMarkdownPrerenderPages(): Array<{ path: string }> {
	return findMdxFiles(contentDocsDir).map((filePath) => {
		const relativePath = relative(contentDocsDir, filePath).split(sep).join('/');
		return { path: getMarkdownPagePath(relativePath) };
	});
}

function readBaseUrl(): string {
	const value = process.env.VITE_BASE_URL || '/';
	if (!value.startsWith('/') || !value.endsWith('/')) {
		throw new Error(`VITE_BASE_URL must start and end with "/", got "${value}"`);
	}
	return value;
}

export default defineConfig(async () => {
	const markdownPrerenderPages = getMarkdownPrerenderPages();
	const baseUrl = readBaseUrl();
	const siteUrl = (process.env.SITE_URL || LOCAL_SITE_URL).replace(TRAILING_SLASH_PATTERN, '');
	// Netlify (default) keeps docs HTML on runtime SSR. Set DOCS_STATIC=true for a
	// fully prerendered static host such as GitHub Pages.
	const docsStatic = isDocsStaticDeploy();

	return {
		// Allow overriding the base URL for deployments to sub-paths (e.g. GitHub Pages).
		// Set VITE_BASE_URL to the base path with a trailing slash, e.g. /luke-ui/
		base: baseUrl,
		// The public origin for absolute URLs. It is baked in at build time so the
		// prerendered files and the SSR function agree.
		define: {
			'import.meta.env.DOCS_STATIC': JSON.stringify(docsStatic ? 'true' : 'false'),
			'import.meta.env.SITE_URL': JSON.stringify(siteUrl),
		},
		environments: {
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
				'@monaco-editor/react',
				'@react-aria/utils',
				'@tanstack/react-router',
				'@vanilla-extract/recipes',
				'@vanilla-extract/recipes/createRuntimeFn',
				// Fumadocs' chrome (search trigger, popover, sidebar) imports icons
				// from lucide-react's barrel, which unbundled is ~1750 separate module
				// requests. On the playground, which also loads Monaco, that exhausts
				// the browser's connection pool and the page never hydrates.
				'fumadocs-ui > lucide-react',
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
		// `vp pack` compiles pre-hydration scripts to inline-able IIFE artifacts;
		// it runs as part of `docs#generate`, not `vp build`. IIFE format needs one
		// entry per pack config (no code-splitting).
		pack: [
			{
				clean: false,
				dts: false,
				// Emitted as `src/generated/<name>.iife.js` — the `.iife` suffix is fixed
				// by tsdown for this format.
				entry: ['src/components/playground/editor-skeleton-script.ts'],
				format: 'iife' as const,
				// Artifacts are inlined into HTML responses, so strip documentation comments.
				minify: true,
				outDir: 'src/generated',
				platform: 'browser' as const,
			},
			{
				clean: false,
				dts: false,
				entry: ['src/lib/theme-prefs-bootstrap-script.ts'],
				format: 'iife' as const,
				minify: true,
				outDir: 'src/generated',
				platform: 'browser' as const,
			},
		],
		plugins: lazyPlugins(async () => [
			staticFunctionBasePathPlugin(),
			highlightSourcePlugin(),
			mdx(await import('./source.config')),
			tailwindcss(),
			vanillaExtractPlugin(),
			tanstackStart({
				pages: [
					{ path: '/api/search' },
					{ path: '/llms.txt' },
					{ path: '/llms-full.txt' },
					{ path: '/sitemap.xml' },
					{ path: '/robots.txt' },
					{ path: '/index.md' },
					// The preview page is loaded via an iframe src, which the link
					// crawler does not follow, so it must be prerendered explicitly.
					{ path: '/playground/preview' },
					...markdownPrerenderPages,
				],
				prerender: {
					// Serialize requests to the internal Vite preview server and retry a
					// transient failure without omitting the iframe preview page.
					concurrency: 1,
					// SSR (Netlify): keep agent/static assets from `pages` above, but do not
					// crawl or auto-discover HTML docs. Netlify `preferStatic` would serve
					// those files without cookies, so theme toggles could not SSR from prefs.
					// Static (DOCS_STATIC): crawl and discover HTML so
					// `staticFunctionMiddleware` can write `__tsr/staticServerFnCache`.
					autoStaticPathsDiscovery: docsStatic,
					crawlLinks: docsStatic,
					enabled: true,
					retryCount: 2,
				},
			}),
			react(),
			// Netlify's local edge runner invokes `deno eval --allow-scripts`, which
			// Deno 2.9.x rejects; docs dev does not need edge emulation.
			netlify({
				dev: {
					edgeFunctions: { enabled: false },
				},
			}),
		]),
		resolve: {
			alias: {
				'#recipe-engine': fileURLToPath(
					new URL(
						'../../packages/@luke-ui/react/src/core/styles/recipe-engine.ts',
						import.meta.url,
					),
				),
			},
			tsconfigPaths: true,
		},
		server: {
			// Keep in sync with `LOCAL_SITE_URL`.
			port: 3000,
		},
	};
});
