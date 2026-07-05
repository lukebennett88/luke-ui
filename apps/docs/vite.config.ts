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
import type { Plugin } from 'vite-plus';
import { defineConfig, lazyPlugins } from 'vite-plus';
import * as z from 'zod';
import packageJson from '../../packages/@luke-ui/react/package.json' with { type: 'json' };
import { mapPublicToInternal, toInternal, toPublic } from './src/lib/markdown-url';

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
const packageJsonPath = join(packageRootDir, 'package.json');
const packageJsonSchema = z.object({
	exports: z.record(z.string(), z.string()),
});

async function readPackageDocsCatalog(): Promise<Array<PackageDocsCatalogEntry>> {
	const currentPackageJson = packageJsonSchema.parse(
		JSON.parse(await readFile(packageJsonPath, 'utf8')),
	);
	return resolvePackageDocsCatalog({
		exportsField: currentPackageJson.exports,
		packageRoot: packageRootDir,
	});
}

function packageDocsPlugin(): Plugin {
	const id = 'virtual:package-docs';
	const resolved = `\0${id}`;
	return {
		configureServer(server) {
			server.watcher.add(packageDocsDir);
			server.watcher.add(packageJsonPath);
			const handle = (filePath: string) => {
				const isPackageDoc = filePath.endsWith('.md') && filePath.startsWith(packageDocsDir);
				const isPackageJson = filePath === packageJsonPath;
				if (!isPackageDoc && !isPackageJson) return;
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
		enforce: 'pre',
		async load(loadId) {
			if (loadId !== resolved) return null;
			const catalog = await readPackageDocsCatalog();
			const metadata: Array<PackageDocsCatalogMetadata> = catalog.map((entry) => ({
				description: entry.description,
				pageKind: entry.pageKind,
				path: entry.path,
				shape: entry.shape,
				slug: entry.slug,
				target: entry.target,
				tier: entry.tier,
				title: entry.title,
			}));
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
		if (filePath === packageJsonPath) return true;
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
			server.watcher.add(packageJsonPath);
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
		exportsField: packageJson.exports,
		packageRoot: packageRootDir,
	});
	const markdownPrerenderPages = await getMarkdownPrerenderPages(packageDocsCatalog);
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
		},
		optimizeDeps: {
			exclude: ['@luke-ui/react'],
		},
		plugins: lazyPlugins(async () => [
			staticFunctionBasePathPlugin(),
			markdownRewritePlugin(),
			packageDocsPlugin(),
			packageSourceWatcherPlugin(),
			mdx(await import('./source.config')),
			tailwindcss(),
			tanstackStart({
				pages: [
					{ path: '/api/search' },
					{ path: '/llms.txt' },
					{ path: '/llms-full.txt' },
					{ path: '/docs/{$}.md' },
					...markdownPrerenderPages,
				],
				prerender: {
					crawlLinks: true,
					enabled: true,
					filter: (page) =>
						!page.path.endsWith('.mdx') &&
						!page.path.endsWith('.md') &&
						!page.path.startsWith(storybookPath),
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
