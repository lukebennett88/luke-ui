import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fromFile } from '@capsizecss/unpack/fs';
import { describe, expect, inject, test } from 'vite-plus/test';
import { findTokenCompatibilityProblems } from '../../theme/__fixtures__/token-compatibility.js';
import type { ThemeInput } from '../../theme/define-theme.js';
import {
	builtAssets,
	importedPackages,
	measureBundle,
	packageContentProblems,
	run,
	themeGenerationIn,
	tryRun,
} from './environment.js';
import { COMPILED_THEMES, themeRootEntry } from './theme-fixture.js';

const { consumers, react, themes } = inject('packedConsumer');

const NODE_24_OR_LATER_PATTERN = /^v(?:2[4-9]|[3-9]\d)\./;
/** Theme package modules a root entry import must never bundle. */
const THEME_INPUT_SOURCE_PATTERN = /^@luke-ui\/theme-[a-z]+\/dist\/input\.js$/;
const FONT_ASSET_PATTERN = /^(.+)-[\w-]{8}\.woff2$/;
const FONT_WEIGHT_RANGE_PATTERN = /font-weight:\s*(\d+)\s+(\d+);/;

describe.skipIf(themes.length === 0)('the packed theme packages', () => {
	for (const theme of themes) {
		const { contents, files, manifest } = theme;

		test(`${manifest.name} ships declarations, its font, and its licence`, () => {
			expect(packageContentProblems(theme)).toEqual({ missingTargets: [], unpublished: [] });
			const declarations = Object.values(manifest.exports)
				.filter((target) => target.endsWith('.js'))
				.map((target) => `${target.slice(2, -'.js'.length)}.d.ts`);
			expect(declarations.filter((file) => !files.includes(file))).toEqual([]);
			expect(files).toEqual(
				expect.arrayContaining(['dist/fonts/inter-latin-wght-normal.woff2', 'dist/fonts/OFL.txt']),
			);
			expect(manifest.peerDependencies).toEqual({ '@luke-ui/react': `^${react.manifest.version}` });
			expect(manifest.dependencies ?? {}).toEqual({});
		});

		test(`${manifest.name} imports only its peer, with Capsize's metrics inlined`, () => {
			expect([...importedPackages(theme)]).toEqual(['@luke-ui/react']);
			expect(Object.keys(manifest.inlinedDependencies ?? {})).toEqual(['@capsizecss/metrics']);
		});

		test(`${manifest.name} ships the Inter its input measures, at every weight it uses`, async () => {
			const input: { theme: ThemeInput } = await import(
				pathToFileURL(path.join(contents, 'dist', 'input.js')).href
			);
			const shipped = await fromFile(
				path.join(contents, 'dist', 'fonts', 'inter-latin-wght-normal.woff2'),
			);
			// `@capsizecss/metrics` adds the font's category, which the font file does not carry.
			expect(input.theme.typography.fonts.body.metrics).toEqual({
				...shipped,
				category: 'sans-serif',
			});

			const fontsCss = readFileSync(path.join(contents, 'dist', 'fonts.css'), 'utf8');
			expect(FONT_WEIGHT_RANGE_PATTERN.exec(fontsCss)?.slice(1).map(Number)).toEqual([100, 900]);
		});
	}

	for (const consumer of consumers) {
		describe(`consumer with ${consumer.label}`, () => {
			const { dir } = consumer;

			test('resolves every theme package export with valid peers', () => {
				const require = createRequire(path.join(dir, 'package.json'));
				for (const { manifest } of themes) {
					for (const subpath of Object.keys(manifest.exports)) {
						const specifier =
							subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
						const resolved = realpathSync(require.resolve(specifier));
						expect({ installed: resolved.startsWith(realpathSync(dir)), specifier }).toEqual({
							installed: true,
							specifier,
						});
					}
				}
				// `npm ls` exits non-zero on a missing or invalid peer.
				expect(tryRun('npm', ['ls', '--all'], dir)).toBe('');
			});

			test('names each theme stylesheet with the class its root entry exports', () => {
				const require = createRequire(path.join(dir, 'package.json'));
				for (const { manifest } of themes) {
					const themeClassName = run(
						'node',
						[
							'--input-type=module',
							'-e',
							`import { themeClassName } from '${manifest.name}'; process.stdout.write(themeClassName);`,
						],
						dir,
					);
					const css = readFileSync(require.resolve(`${manifest.name}/stylesheet.css`), 'utf8');
					expect({
						name: manifest.name,
						selects: css.includes(`:where(html).${themeClassName} {`),
					}).toEqual({ name: manifest.name, selects: true });
				}
			});

			test('compiles standalone themes, and ships theme stylesheets, that declare every contract token', () => {
				const require = createRequire(path.join(dir, 'package.json'));
				const stylesheets: Record<string, string> = {};
				for (const [name, file] of Object.entries(COMPILED_THEMES)) {
					stylesheets[name] = path.join(dir, file);
				}
				for (const { manifest } of themes) {
					stylesheets[manifest.name.slice('@luke-ui/theme-'.length)] = require.resolve(
						`${manifest.name}/stylesheet.css`,
					);
				}
				for (const [name, file] of Object.entries(stylesheets)) {
					const problems = findTokenCompatibilityProblems(readFileSync(file, 'utf8'), name);
					expect({ name, problems }).toEqual({ name, problems: [] });
				}
				// The product theme extends Paper and stands alone: it never names Paper's identity.
				expect(readFileSync(stylesheets.product!, 'utf8')).not.toContain('luke-ui-theme-paper');
			});

			test('runs the documented `node compile-theme.ts` with Node 24 and writes a complete theme', () => {
				expect(run('node', ['--version'], dir)).toMatch(NODE_24_OR_LATER_PATTERN);
				run('node', ['compile-theme.ts'], dir);

				const css = readFileSync(path.join(dir, 'src', 'theme.css'), 'utf8');
				expect(findTokenCompatibilityProblems(css, 'product')).toEqual([]);
			});

			test('keeps theme stylesheets and their fonts in a Vite build', () => {
				const assets = builtAssets(dir);
				const css = assets.read('.css');
				const fonts = assets.names.filter((name) => name.endsWith('.woff2'));
				expect(new Set(fonts.map((name) => FONT_ASSET_PATTERN.exec(name)?.[1]))).toEqual(
					new Set(['inter-latin-wght-normal', 'lora-latin-400-normal']),
				);
				for (const font of fonts) expect(css).toContain(font);
				expect(css).toContain(':where(html).luke-ui-theme-tactile');
				expect(css).toContain(':where(html).luke-ui-theme-product');
			});

			for (const { manifest } of themes) {
				test(
					`keeps a ${manifest.name} themeClassName import apart from its input and the compiler`,
					{ timeout: 60_000 },
					() => {
						const bundle = measureBundle(dir, themeRootEntry(manifest.name));

						// The root entry itself, so the checks below cannot pass on an empty bundle.
						expect(bundle.sources).toContain(`${manifest.name}/dist/index.js`);
						expect({
							input: bundle.sources.filter((source) => THEME_INPUT_SOURCE_PATTERN.test(source)),
							themeGeneration: themeGenerationIn(bundle, consumer),
						}).toEqual({ input: [], themeGeneration: [] });
					},
				);
			}
		});
	}
});
