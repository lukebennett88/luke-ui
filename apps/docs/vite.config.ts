import { spawn } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverExports } from '@luke-ui/docs-tools/discover-exports';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { readdir, readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import packageJson from '../../packages/@luke-ui/react/package.json' with { type: 'json' };
import { mapPublicToInternal, toInternal, toPublic } from './src/lib/markdown-url';

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

function markdownRewritePlugin(): Plugin {
	return {
		name: 'markdown-rewrite',
		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				const rewritten = mapPublicToInternal(req.url);
				if (rewritten) req.url = rewritten;
				next();
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((req, _res, next) => {
				const rewritten = mapPublicToInternal(req.url);
				if (rewritten) req.url = rewritten;
				next();
			});
		},
	};
}

const contentDocsDir = fileURLToPath(new URL('./content/docs/', import.meta.url));
const packageRootDir = fileURLToPath(new URL('../../packages/@luke-ui/react/', import.meta.url));
const packageSrcDir = fileURLToPath(new URL('../../packages/@luke-ui/react/src/', import.meta.url));
const packageDocsDir = fileURLToPath(
	new URL('../../packages/@luke-ui/react/docs/', import.meta.url),
);

// Expose generated package docs as `virtual:package-docs`. The `/llms.mdx/$`
// route serves these to AI agents fetching `.mdx` URLs. We can't read them via
// `import.meta.glob` because `fumadocs-mdx/vite` compiles any `.md`/`.mdx` it
// sees into a React component, even with the `?raw` query.
function packageDocsPlugin(): Plugin {
	const id = 'virtual:package-docs';
	const resolved = `\0${id}`;
	return {
		name: 'package-docs',
		enforce: 'pre',
		resolveId(source) {
			return source === id ? resolved : null;
		},
		async load(loadId) {
			if (loadId !== resolved) return null;
			const filenames = (await readdir(packageDocsDir)).filter((n) => n.endsWith('.md'));
			const entries = await Promise.all(
				filenames.map(
					async (filename) =>
						[
							filename.slice(0, -'.md'.length),
							await readFile(join(packageDocsDir, filename), 'utf8'),
						] as const,
				),
			);
			return `export const packageDocs = ${JSON.stringify(Object.fromEntries(entries))};`;
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
	};
}

async function getMarkdownPrerenderPages(): Promise<
	Array<{ path: string; prerender: { outputPath: string } }>
> {
	const contentPages = (await findMdxFiles(contentDocsDir)).map((filePath) => {
		const publicPath = getPublicMarkdownPath(filePath);
		const internalPath = toInternal(publicPath);
		if (!internalPath) throw new Error(`Could not map ${publicPath} to an internal markdown URL.`);
		return {
			path: internalPath,
			prerender: { outputPath: publicPath },
		};
	});
	const packagePages = discoverExports(packageJson.exports).flatMap((entry) => {
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
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: false,
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
		name: 'package-source-watcher',
		apply: 'serve',
		configureServer(server) {
			server.watcher.add(packageSrcDir);
			const logger = {
				info: (msg: string) => server.config.logger.info(msg, { timestamp: true }),
				error: (msg: string) => server.config.logger.error(msg, { timestamp: true }),
			};
			const handleChange = (filePath: string) => {
				if (!shouldTrigger(filePath)) return;
				schedule(logger);
			};
			server.watcher.on('add', handleChange);
			server.watcher.on('change', handleChange);
			server.watcher.on('unlink', handleChange);
		},
	};
}

export default defineConfig(async () => {
	const markdownPrerenderPages = await getMarkdownPrerenderPages();

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
		resolve: {
			external: ['ts-morph'],
			tsconfigPaths: true,
		},
		plugins: [
			storySourcePathPlugin(),
			staticFunctionBasePathPlugin(),
			markdownRewritePlugin(),
			packageDocsPlugin(),
			packageSourceWatcherPlugin(),
			mdx(await import('./source.config')),
			tailwindcss(),
			tanstackStart({
				prerender: {
					enabled: true,
					crawlLinks: true,
					filter: (page) => !page.path.endsWith('.mdx'),
				},
				pages: [
					{ path: '/api/search' },
					{ path: '/llms.txt' },
					{ path: '/llms-full.txt' },
					...markdownPrerenderPages,
				],
			}),
			react(),
			nitro(),
		],
		server: {
			port: 3000,
		},
	};
});
