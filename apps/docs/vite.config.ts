import { spawn } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
	PackageDocsCatalogEntry,
	PackageDocsCatalogMetadata,
} from '@luke-ui/docs-tools/package-docs-catalog';
import { resolvePackageDocsCatalog } from '@luke-ui/docs-tools/package-docs-catalog';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { readdir, readFile } from 'node:fs/promises';
import { defineConfig, lazyPlugins } from 'vite-plus';
import type { Plugin } from 'vite-plus';
import packageJson from '../../packages/@luke-ui/react/package.json' with { type: 'json' };
import { mapPublicToInternal, toInternal, toPublic } from './src/lib/markdown-url';

// Freezes `import.meta.url` to the source file URL in story files and lib/story.ts.
// At runtime the preview server runs from the compiled .output/server directory,
// but ts-morph (via getStoryPayloads) and lib/story.ts's appRoot calculation need
// the original source paths.
function storySourcePathPlugin(): Plugin {
	return {
		enforce: 'pre',
		name: 'story-source-path',
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

function markdownRewritePlugin(): Plugin {
	return {
		configurePreviewServer(server) {
			server.middlewares.use((req, _res, next) => {
				const rewritten = mapPublicToInternal(req.url, server.config.base);
				if (rewritten) req.url = rewritten;
				next();
			});
		},
		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				const rewritten = mapPublicToInternal(req.url, server.config.base);
				if (rewritten) req.url = rewritten;
				next();
			});
		},
		name: 'markdown-rewrite',
	};
}

const contentDocsDir = fileURLToPath(new URL('./content/docs/', import.meta.url));
const packageRootDir = fileURLToPath(new URL('../../packages/@luke-ui/react/', import.meta.url));
const packageSrcDir = fileURLToPath(new URL('../../packages/@luke-ui/react/src/', import.meta.url));
const packageDocsDir = fileURLToPath(
	new URL('../../packages/@luke-ui/react/docs/', import.meta.url),
);

// Expose generated package docs as `virtual:package-docs`. The `/markdown/$`
// routes serve these to AI agents fetching public `.md` URLs. We can't read them via
// `import.meta.glob` because `fumadocs-mdx/vite` compiles any `.md`/`.mdx` it
// sees into a React component, even with the `?raw` query.
function packageDocsPlugin(catalog: Array<PackageDocsCatalogEntry>): Plugin {
	const id = 'virtual:package-docs';
	const resolved = `\0${id}`;
	const metadata: Array<PackageDocsCatalogMetadata> = catalog.map((entry) => ({
		path: entry.path,
		target: entry.target,
		slug: entry.slug,
		shape: entry.shape,
		pageKind: entry.pageKind,
		tier: entry.tier,
		title: entry.title,
		description: entry.description,
	}));
	return {
		enforce: 'pre',
		async load(loadId) {
			if (loadId !== resolved) return null;
			const entries = await Promise.all(
				catalog
					.filter((entry) => entry.pageKind !== 'asset')
					.map(
						async (entry) =>
							[
								entry.slug,
								await readFile(join(packageDocsDir, `${entry.slug}.md`), 'utf8'),
							] as const,
					),
			);
			return [
				`export const packageDocsCatalog = ${JSON.stringify(metadata)};`,
				`export const packageDocs = ${JSON.stringify(Object.fromEntries(entries))};`,
			].join('\n');
		},
		configureServer(server) {
			server.watcher.add(packageDocsDir);
			const handle = (filePath: string) => {
				if (!filePath.endsWith('.md') || !filePath.startsWith(packageDocsDir)) return;
				const mod = server.moduleGraph.getModuleById(resolved);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
					server.ws.send({ type: 'full-reload' });
				}
			};
			server.watcher.on('add', handle);
			server.watcher.on('change', handle);
			server.watcher.on('unlink', handle);
		},
		name: 'package-docs',
		resolveId(source) {
			return source === id ? resolved : null;
		},
	};
}

async function getMarkdownPrerenderPages(
	catalog: Array<PackageDocsCatalogEntry>,
): Promise<Array<{ path: string; prerender: { outputPath: string } }>> {
	const contentPages = (await findMdxFiles(contentDocsDir)).map((filePath) => {
		const publicPath = getPublicMarkdownPath(filePath);
		const internalPath = toInternal(publicPath);
		if (!internalPath) throw new Error(`Could not map ${publicPath} to an internal markdown URL.`);
		return {
			path: internalPath,
			prerender: { outputPath: publicPath },
		};
	});
	const packagePages = catalog.flatMap((entry) => {
		if (entry.shape !== 'barrel') return [];
		return [
			{
				path: toInternal(toPublic(entry.slug)) ?? '',
				prerender: { outputPath: toPublic(entry.slug) },
			},
		];
	});
	return [...contentPages, ...packagePages];
}

async function findMdxFiles(dir: string): Promise<Array<string>> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) return findMdxFiles(path);
			return entry.isFile() && entry.name.endsWith('.mdx') ? [path] : [];
		}),
	);
	return files.flat();
}

function getPublicMarkdownPath(filePath: string): string {
	const relativePath = relative(contentDocsDir, filePath).split(sep).join('/');
	const withoutExtension = relativePath.slice(0, -'.mdx'.length);
	return toPublic(withoutExtension === 'index' ? 'index' : withoutExtension);
}

/**
 * Watch @luke-ui/react source files and regenerate `docs/*.md` when JSDoc or
 * prose changes. fumadocs-mdx tracks `<include>` dependencies, so once the
 * generated file changes the parent MDX page reloads automatically.
 *
 * Dev-only (`apply: 'serve'`); production builds rely on turbo's
 * `dev`→`generate` / `build`→`generate` dependency for initial generation.
 */
function packageSourceWatcherPlugin(): Plugin {
	const debounceMs = 300;
	let timer: NodeJS.Timeout | undefined;
	let inFlight: ReturnType<typeof spawn> | undefined;
	let pendingRun = false;

	function shouldTrigger(filePath: string): boolean {
		if (!filePath.startsWith(packageSrcDir)) return false;
		return filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.docs.md');
	}

	function runGenerator(logger: {
		info: (msg: string) => void;
		error: (msg: string) => void;
	}): void {
		if (inFlight) {
			pendingRun = true;
			return;
		}
		logger.info('[package-docs] regenerating @luke-ui/react docs...');
		const child = spawn('pnpm', ['--filter', '@luke-ui/react', 'generate:docs'], {
			cwd: packageRootDir,
			shell: false,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		inFlight = child;

		let stderr = '';
		child.stderr?.on('data', (chunk: Buffer) => {
			stderr += chunk.toString();
		});
		child.stdout?.on('data', () => {
			// Swallow stdout — fumadocs-mdx HMR announces the resulting reload.
		});
		child.on('error', (err) => {
			logger.error(`[package-docs] failed to spawn generator: ${err.message}`);
			inFlight = undefined;
		});
		child.on('exit', (code) => {
			inFlight = undefined;
			if (code !== 0) {
				logger.error(
					`[package-docs] generator exited with code ${code}.${stderr ? `\n${stderr.trim()}` : ''}`,
				);
			} else {
				logger.info('[package-docs] regenerated.');
			}
			if (pendingRun) {
				pendingRun = false;
				runGenerator(logger);
			}
		});
	}

	function schedule(logger: { info: (msg: string) => void; error: (msg: string) => void }): void {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			runGenerator(logger);
		}, debounceMs);
	}

	return {
		apply: 'serve',
		configureServer(server) {
			server.watcher.add(packageSrcDir);
			const logger = {
				error: (msg: string) => server.config.logger.error(msg, { timestamp: true }),
				info: (msg: string) => server.config.logger.info(msg, { timestamp: true }),
			};
			const handleChange = (filePath: string) => {
				if (!shouldTrigger(filePath)) return;
				schedule(logger);
			};
			server.watcher.on('add', handleChange);
			server.watcher.on('change', handleChange);
			server.watcher.on('unlink', handleChange);
		},
		name: 'package-source-watcher',
	};
}

export default defineConfig(async () => {
	const packageDocsCatalog = resolvePackageDocsCatalog({
		packageRoot: packageRootDir,
		exportsField: packageJson.exports,
	});
	const markdownPrerenderPages = await getMarkdownPrerenderPages(packageDocsCatalog);

	return {
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
		plugins: lazyPlugins(async () => [
			storySourcePathPlugin(),
			staticFunctionBasePathPlugin(),
			markdownRewritePlugin(),
			packageDocsPlugin(packageDocsCatalog),
			packageSourceWatcherPlugin(),
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
					filter: (page) => !page.path.endsWith('.mdx') && !page.path.endsWith('.md'),
				},
			}),
			react(),
			nitro(),
		]),
		resolve: {
			external: ['ts-morph'],
			tsconfigPaths: true,
		},
		server: {
			port: 3000,
		},
	};
});
