import { execFileSync } from 'node:child_process';
import { realpathSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));

/**
 * Installs the packed `@luke-ui/react` tarball through npm in an isolated directory with no
 * workspace dependency links. Proves SSR, hydration, CSS/SVG resolution, and that unpublished
 * `@luke-ui/rainbow-sprinkles` is not required.
 */
test(
	'installs the packed tarball with npm and proves SSR, hydration, and asset resolution',
	{ timeout: 120_000 },
	async () => {
		const workDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-react-consumer-'));
		const tarballDir = path.join(workDir, 'pack');
		const consumerDir = path.join(workDir, 'consumer');
		try {
			await writeFile(path.join(workDir, 'package.json'), JSON.stringify({ private: true }));
			execFileSync('mkdir', ['-p', tarballDir, consumerDir]);

			const tarballName = packReactTarball(tarballDir);
			const tarballPath = path.join(tarballDir, tarballName);
			const packedPackageJson = readPackedPackageJson(tarballPath);

			expect('@luke-ui/rainbow-sprinkles' in packedPackageJson.dependencies).toBe(false);
			expect('@luke-ui/rainbow-sprinkles' in (packedPackageJson.peerDependencies ?? {})).toBe(
				false,
			);
			expect(JSON.stringify(packedPackageJson.dependencies)).not.toContain('catalog:');
			expect(JSON.stringify(packedPackageJson.peerDependencies)).not.toContain('catalog:');

			await writeFile(
				path.join(consumerDir, 'package.json'),
				JSON.stringify(
					{
						name: 'packed-consumer-fixture',
						private: true,
						type: 'module',
						dependencies: {
							'@luke-ui/react': `file:${tarballPath}`,
							...packedPackageJson.peerDependencies,
							jsdom: '^26.1.0',
						},
					},
					null,
					2,
				),
			);

			execFileSync('npm', ['install', '--ignore-scripts'], {
				cwd: consumerDir,
				encoding: 'utf8',
				env: {
					PATH: process.env.PATH ?? '',
					HOME: process.env.HOME ?? '',
					npm_config_cache: process.env.npm_config_cache,
					npm_config_registry: process.env.npm_config_registry,
				},
				stdio: ['ignore', 'pipe', 'pipe'],
			});

			const installedReactRoot = realpathSync(
				path.join(consumerDir, 'node_modules', '@luke-ui', 'react'),
			);
			expect(installedReactRoot.startsWith(consumerDir)).toBe(true);
			expect(installedReactRoot.includes(`${path.sep}packages${path.sep}`)).toBe(false);
			expect(
				pathExists(path.join(consumerDir, 'node_modules', '@luke-ui', 'rainbow-sprinkles')),
			).toBe(false);

			const utilitiesSource = await readFile(
				path.join(installedReactRoot, 'dist', findUtilitiesChunk(installedReactRoot)),
				'utf8',
			);
			expect(utilitiesSource).not.toContain('@luke-ui/rainbow-sprinkles');

			const probeScript = path.join(consumerDir, 'probe.mjs');
			await writeFile(probeScript, PROBE_SCRIPT);

			const output = execFileSync('node', [probeScript], {
				cwd: consumerDir,
				encoding: 'utf8',
				env: { PATH: process.env.PATH ?? '' },
			});
			const parsed: unknown = JSON.parse(output);
			if (!isRecord(parsed)) {
				throw new Error('Expected packed consumer probe to return a JSON object.');
			}

			expect(parsed.markup).toEqual(expect.stringContaining('<blockquote'));
			expect(parsed.markup).toEqual(expect.stringContaining('Hello world'));
			expect(parsed.markup).toEqual(expect.stringContaining('<svg'));
			expect(parsed.layoutId).toBe('sprinkles-root');
			expect(typeof parsed.className).toBe('string');
			expect(String(parsed.className).length).toBeGreaterThan(0);
			expect(parsed.bp768).toBe(768);
			expect(parsed.stylesheetBytes).toEqual(expect.any(Number));
			expect(Number(parsed.stylesheetBytes)).toBeGreaterThan(0);
			expect(parsed.spritesheetBytes).toEqual(expect.any(Number));
			expect(Number(parsed.spritesheetBytes)).toBeGreaterThan(0);
			expect(parsed.themeStylesheetBytes).toEqual(expect.any(Number));
			expect(Number(parsed.themeStylesheetBytes)).toBeGreaterThan(0);
			expect(parsed.hydrated).toBe(true);
		} finally {
			await rm(workDir, { force: true, recursive: true });
		}
	},
);

const PROBE_SCRIPT = `
import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Blockquote } from '@luke-ui/react/blockquote';
import { Icon, IconSpritesheetProvider } from '@luke-ui/react/icon';
import { breakpoints, createSprinkles } from '@luke-ui/react/styles';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const stylesheetPath = require.resolve('@luke-ui/react/stylesheet.css');
const spritesheetPath = require.resolve('@luke-ui/react/spritesheet.svg');
const themeStylesheetPath = require.resolve('@luke-ui/react/themes/tactile/stylesheet.css');
const spritesheetHref = spritesheetPath;

const layout = createSprinkles({ display: 'flex', id: 'sprinkles-root' });
if (!createSprinkles.properties.has('display')) {
	throw new Error('createSprinkles.properties must include display');
}
if (layout.id !== 'sprinkles-root') {
	throw new Error('createSprinkles must pass through non-utility props');
}
if (breakpoints.bp768 !== 768) {
	throw new Error('breakpoints.bp768 must be 768');
}

function app() {
	return createElement(
		IconSpritesheetProvider,
		{ href: spritesheetHref },
		createElement(Blockquote, null, 'Hello world'),
		createElement(Icon, { name: 'chevronDown', 'aria-label': 'Expand' }),
	);
}

const markup = renderToString(app());
const dom = new JSDOM(\`<!doctype html><html><body><div id="root">\${markup}</div></body></html>\`, {
	url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Node = dom.window.Node;

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');
hydrateRoot(root, app());
await new Promise((resolve) => setTimeout(resolve, 25));

process.stdout.write(
	JSON.stringify({
		markup,
		layoutId: layout.id,
		className: layout.className,
		bp768: breakpoints.bp768,
		stylesheetBytes: readFileSync(stylesheetPath).byteLength,
		spritesheetBytes: readFileSync(spritesheetPath).byteLength,
		themeStylesheetBytes: readFileSync(themeStylesheetPath).byteLength,
		hydrated: root.innerHTML.includes('Hello world') && root.innerHTML.includes('<svg'),
	}),
);
`;

function packReactTarball(destination: string): string {
	const output = execFileSync('pnpm', ['pack', '--pack-destination', destination], {
		cwd: packageRoot,
		encoding: 'utf8',
	});
	const match = /luke-ui-react-[^\s/]+\.tgz/.exec(output);
	if (match === null) {
		throw new Error(`Expected pnpm pack to print a tarball name, received:\n${output}`);
	}
	return match[0];
}

function readPackedPackageJson(tarballPath: string): {
	dependencies: Record<string, string>;
	peerDependencies?: Record<string, string>;
} {
	const raw = execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
		encoding: 'utf8',
	});
	const parsed: unknown = JSON.parse(raw);
	if (!isRecord(parsed) || !isRecord(parsed.dependencies)) {
		throw new Error('Expected packed package.json to define dependencies.');
	}
	return {
		dependencies: parsed.dependencies as Record<string, string>,
		peerDependencies: isRecord(parsed.peerDependencies)
			? (parsed.peerDependencies as Record<string, string>)
			: undefined,
	};
}

function findUtilitiesChunk(installedReactRoot: string): string {
	const chunk = readdirSync(path.join(installedReactRoot, 'dist')).find(
		(name) => name.startsWith('utilities.css-') && name.endsWith('.js'),
	);
	if (chunk === undefined) {
		throw new Error('Expected a utilities.css-*.js chunk in the installed package.');
	}
	return chunk;
}

function pathExists(target: string): boolean {
	try {
		realpathSync(target);
		return true;
	} catch {
		return false;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
