import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { expect, test } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));

// Matches Node's module-resolution failure code, wherever it appears in combined stdout/stderr.
const ERR_MODULE_NOT_FOUND_PATTERN = /ERR_MODULE_NOT_FOUND/;

/**
 * Packs the real tarball and wires a throwaway consumer directory that reproduces pnpm's
 * dependency isolation: Luke UI's own `dependencies` are symlinked NESTED under
 * `@luke-ui/react/node_modules`, private to Luke UI's own code, exactly like a real pnpm install
 * — resolvable from inside the package, not resolvable from the consumer's own top-level scripts.
 * `peerDependencies` are symlinked at the consumer's TOP level, because a real consumer declares
 * those itself. `consumerDependencies` lets a test declare additional packages the fake consumer
 * itself depends on (also linked top level, and listed in the generated consumer `package.json`),
 * for cases where a consumer script needs to import something Luke UI only depends on privately —
 * proving that it must declare that dependency itself rather than relying on Luke UI's transitive
 * copy. No NODE_PATH or workspace config is set, so anything a consumer script imports has to
 * resolve the way a real installed consumer's would. Returns the consumer directory and the
 * packed package root; the caller is responsible for cleanup via the `cleanup` function.
 */
async function packAndLinkConsumer(
	options: { consumerDependencies?: Array<string> } = {},
): Promise<{
	cleanup: () => Promise<void>;
	consumerDir: string;
	packedPackageRoot: string;
}> {
	const { consumerDependencies = [] } = options;
	const tarballDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-react-pack-'));
	const consumerDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-react-consumer-'));
	const tarballName = execFileSync('npm', ['pack', '--silent', '--pack-destination', tarballDir], {
		cwd: packageRoot,
		encoding: 'utf8',
	}).trim();
	const tarballPath = path.join(tarballDir, tarballName);

	execFileSync('tar', ['-xzf', tarballPath, '-C', consumerDir]);
	const packedPackageRoot = path.join(consumerDir, 'package');
	const packedPackageJson: unknown = JSON.parse(
		await readFile(path.join(packedPackageRoot, 'package.json'), 'utf8'),
	);
	if (
		!isRecord(packedPackageJson) ||
		!isRecord(packedPackageJson.dependencies) ||
		!isRecord(packedPackageJson.peerDependencies)
	) {
		throw new Error('Expected packed package.json to define dependency objects.');
	}
	const ownDependencies = Object.keys(packedPackageJson.dependencies);
	const peerDependencies = Object.keys(packedPackageJson.peerDependencies);

	const consumerNodeModules = path.join(consumerDir, 'node_modules');
	const packedPackageNodeModules = path.join(packedPackageRoot, 'node_modules');
	await mkdir(path.join(consumerNodeModules, '@luke-ui'), { recursive: true });
	await symlink(packedPackageRoot, path.join(consumerNodeModules, '@luke-ui', 'react'));

	async function linkDependency(rootNodeModules: string, dependency: string) {
		const dependencyDir = path.dirname(
			require.resolve(`${dependency}/package.json`, { paths: [packageRoot] }),
		);
		const linkPath = path.join(rootNodeModules, dependency);
		await mkdir(path.dirname(linkPath), { recursive: true });
		await symlink(dependencyDir, linkPath);
	}

	await Promise.all([
		// Luke UI's own dependencies: nested under the packed package, private to Luke UI's code.
		...ownDependencies.map((dependency) => linkDependency(packedPackageNodeModules, dependency)),
		// Peer dependencies: top level, as a real consumer declares them itself.
		...peerDependencies.map((dependency) => linkDependency(consumerNodeModules, dependency)),
		// Additional dependencies this fake consumer declares for itself.
		...consumerDependencies.map((dependency) => linkDependency(consumerNodeModules, dependency)),
	]);

	await writeFile(
		path.join(consumerDir, 'package.json'),
		JSON.stringify({
			name: 'packed-consumer-fixture',
			private: true,
			type: 'module',
			dependencies: Object.fromEntries(
				['@luke-ui/react', ...peerDependencies, ...consumerDependencies].map((dependency) => [
					dependency,
					'*',
				]),
			),
		}),
	);

	return {
		cleanup: async () => {
			await rm(tarballDir, { force: true, recursive: true });
			await rm(consumerDir, { force: true, recursive: true });
		},
		consumerDir,
		packedPackageRoot,
	};
}

test(
	'renders a component from the packed tarball in a plain node process, with no StyleX compiler',
	{ timeout: 60_000 },
	async () => {
		// Mirrors the documented install command: an application authoring `xstyle` installs
		// `@stylexjs/stylex` directly, and does not rely on Luke UI's transitive copy.
		const { cleanup, consumerDir } = await packAndLinkConsumer({
			consumerDependencies: ['@stylexjs/stylex'],
		});
		try {
			const renderScript = path.join(consumerDir, 'render.mjs');
			await writeFile(
				renderScript,
				[
					"import { createElement } from 'react';",
					"import { renderToStaticMarkup } from 'react-dom/server';",
					"import { Blockquote } from '@luke-ui/react/blockquote';",
					'',
					"const markup = renderToStaticMarkup(createElement(Blockquote, null, 'Hello world'));",
					'process.stdout.write(markup);',
				].join('\n'),
			);

			const markup = execFileSync('node', [renderScript], {
				cwd: consumerDir,
				encoding: 'utf8',
				// No NODE_PATH or workspace config that could smuggle in a compiler.
				env: { PATH: process.env.PATH ?? '' },
			});

			expect(markup).toContain('<blockquote');
			expect(markup).toContain('Hello world');

			const consumerSource = [
				"import * as stylex from '@stylexjs/stylex';",
				"export const consumerStyles = stylex.create({ override: { color: 'rgb(9, 9, 9)' } });",
			].join('\n');
			const transformedConsumer = await transformAsync(consumerSource, {
				babelrc: false,
				configFile: false,
				filename: path.join(consumerDir, 'consumer-style.ts'),
				plugins: [
					stylexBabelPlugin.withOptions({
						dev: false,
						// Matches the real `@luke-ui/vite` consumer compile (`application-order`), so this
						// fixture proves the same resolution mode a real consumer gets — the mode that
						// makes a shorthand's compiled style tombstone the longhand keys it overlaps (see
						// `stylex-layer-contract.md`), not just a config value with no runtime effect.
						styleResolution: 'application-order',
						unstable_moduleResolution: { type: 'commonJS', rootDir: consumerDir },
					}),
				],
			});
			if (transformedConsumer?.code == null)
				throw new Error('Expected the consumer StyleX transform.');
			const consumerRules = (
				transformedConsumer.metadata as {
					stylex?: Parameters<typeof stylexBabelPlugin.processStylexRules>[0];
				}
			).stylex;
			if (consumerRules === undefined) throw new Error('Expected consumer StyleX rules.');
			const consumerCss = stylexBabelPlugin.processStylexRules(consumerRules);
			expect(consumerCss).not.toContain('@layer');
			expect(consumerCss).toMatch(/color:rgb\(9,\s*9,\s*9\)/);
			await writeFile(path.join(consumerDir, 'consumer-style.mjs'), transformedConsumer.code);

			await writeFile(
				renderScript,
				[
					"import { createElement } from 'react';",
					"import { renderToStaticMarkup } from 'react-dom/server';",
					"import * as stylex from '@stylexjs/stylex';",
					"import { Text, textRecipe } from '@luke-ui/react/text';",
					"import { consumerStyles } from './consumer-style.mjs';",
					'',
					"const markup = renderToStaticMarkup(createElement(Text, { color: 'accent', xstyle: consumerStyles.override }, 'Hello world'));",
					'process.stdout.write(JSON.stringify({',
					'  markup,',
					"  accentClasses: textRecipe({ color: 'accent' }).className,",
					'  defaultClasses: textRecipe().className,',
					'  overrideClass: stylex.props(consumerStyles.override).className,',
					'}));',
				].join('\n'),
			);
			const output = JSON.parse(
				execFileSync('node', [renderScript], {
					cwd: consumerDir,
					encoding: 'utf8',
					env: { PATH: process.env.PATH ?? '' },
				}),
			) as {
				accentClasses: string;
				defaultClasses: string;
				markup: string;
				overrideClass: string;
			};
			const defaultClassSet = new Set(output.defaultClasses.split(' '));
			const competingColorClass = output.accentClasses
				.split(' ')
				.find((className) => className !== '' && !defaultClassSet.has(className));
			expect(competingColorClass).toBeDefined();
			expect(output.markup).toContain(output.overrideClass);
			expect(output.markup).not.toContain(competingColorClass);
		} finally {
			await cleanup();
		}
	},
);

/**
 * The consumer script this test writes: it imports `@stylexjs/stylex` and calls `stylex.props()`
 * on a trivial style, so a resolution failure surfaces before anything else runs.
 */
function writeUndeclaredStylexImportScript(consumerDir: string): Promise<string> {
	const script = path.join(consumerDir, 'undeclared-stylex-import.mjs');
	return writeFile(
		script,
		[
			"import * as stylex from '@stylexjs/stylex';",
			'',
			"const { className } = stylex.props(stylex.create({ base: { color: 'red' } }).base);",
			'process.stdout.write(className);',
		].join('\n'),
	).then(() => script);
}

test(
	'a consumer that imports @stylexjs/stylex without declaring it cannot resolve it',
	{ timeout: 60_000 },
	async () => {
		const { cleanup, consumerDir } = await packAndLinkConsumer();
		try {
			const undeclaredImportScript = await writeUndeclaredStylexImportScript(consumerDir);

			let resolutionError: unknown;
			try {
				execFileSync('node', [undeclaredImportScript], {
					cwd: consumerDir,
					env: { PATH: process.env.PATH ?? '' },
				});
			} catch (error) {
				resolutionError = error;
			}
			if (!isExecFileError(resolutionError)) {
				throw new Error('Expected the undeclared @stylexjs/stylex import to fail to resolve.');
			}
			const combinedOutput = `${resolutionError.stdout?.toString() ?? ''}${resolutionError.stderr?.toString() ?? ''}`;
			expect(combinedOutput).toMatch(ERR_MODULE_NOT_FOUND_PATTERN);
			expect(combinedOutput).toContain('@stylexjs/stylex');

			// Luke UI still resolves ITS OWN nested `@stylexjs/stylex` fine in this same consumer —
			// proving the isolation is correct (Luke UI's private dependency stays private), not just
			// broken (nothing in this consumer can import anything).
			const renderScript = path.join(consumerDir, 'render.mjs');
			await writeFile(
				renderScript,
				[
					"import { createElement } from 'react';",
					"import { renderToStaticMarkup } from 'react-dom/server';",
					"import { Blockquote } from '@luke-ui/react/blockquote';",
					'',
					"const markup = renderToStaticMarkup(createElement(Blockquote, null, 'Hello world'));",
					'process.stdout.write(markup);',
				].join('\n'),
			);
			const markup = execFileSync('node', [renderScript], {
				cwd: consumerDir,
				encoding: 'utf8',
				env: { PATH: process.env.PATH ?? '' },
			});
			expect(markup).toContain('<blockquote');
			expect(markup).toContain('Hello world');
		} finally {
			await cleanup();
		}
	},
);

// The `overrides` sibling-layer configuration `@luke-ui/vite` applies when extracting consumer
// StyleX for the `xstyle` prop. This file proves the cascade contract against a packed
// `@luke-ui/react` tarball. Vite build/dev coverage for the public plugin lives in `@luke-ui/vite`.
const OVERRIDES_LAYERS_BEFORE = ['reset', 'theme', 'base', 'recipes'];
const OVERRIDES_LAYERS_AFTER = ['utilities'];
const OVERRIDES_LAYER_PREFIX = 'overrides';

test(
	'a real consumer StyleX compile proves the published xstyle precedence against real cascade resolution',
	{ timeout: 60_000 },
	async () => {
		// An application authoring `xstyle` installs `@stylexjs/stylex` directly and does not rely
		// on Luke UI's transitive copy.
		const { cleanup, consumerDir, packedPackageRoot } = await packAndLinkConsumer({
			consumerDependencies: ['@stylexjs/stylex'],
		});
		let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
		try {
			// Compiles consumer StyleX with the same layer configuration `@luke-ui/vite` uses, without
			// going through this package's `createStylexDevPlugin`, so the cascade assertion covers the
			// public layer contract rather than the in-repo recipe-layer path.
			// `paddingLonghand`/`paddingShorthand` back the shorthand/longhand overlap assertions below,
			// proving the real published contract (not just the color-only `override` case).
			const consumerSource = [
				"import * as stylex from '@stylexjs/stylex';",
				'export const consumerStyles = stylex.create({',
				"  override: { color: 'rgb(9, 9, 9)' },",
				"  paddingLonghand: { paddingInlineStart: '4px' },",
				"  paddingShorthand: { padding: '20px' },",
				'});',
			].join('\n');
			const transformedConsumer = await transformAsync(consumerSource, {
				babelrc: false,
				configFile: false,
				filename: path.join(consumerDir, 'xstyle-consumer-style.ts'),
				plugins: [
					stylexBabelPlugin.withOptions({
						dev: false,
						// Matches the real `@luke-ui/vite` consumer compile (`application-order`), so this
						// fixture proves the same resolution mode a real consumer gets — the mode that
						// makes a shorthand's compiled style tombstone the longhand keys it overlaps (see
						// `stylex-layer-contract.md`), not just a config value with no runtime effect.
						styleResolution: 'application-order',
						unstable_moduleResolution: { type: 'commonJS', rootDir: consumerDir },
					}),
				],
			});
			if (transformedConsumer?.code == null)
				throw new Error('Expected the consumer StyleX transform.');
			const consumerRules = (
				transformedConsumer.metadata as {
					stylex?: Parameters<typeof stylexBabelPlugin.processStylexRules>[0];
				}
			).stylex;
			if (consumerRules === undefined) throw new Error('Expected consumer StyleX rules.');

			const consumerStylexCss = stylexBabelPlugin.processStylexRules(consumerRules, {
				useLayers: {
					after: OVERRIDES_LAYERS_AFTER,
					before: OVERRIDES_LAYERS_BEFORE,
					prefix: OVERRIDES_LAYER_PREFIX,
				},
			});
			expect(consumerStylexCss).toContain(`@layer ${OVERRIDES_LAYER_PREFIX}.priority1`);
			await writeFile(
				path.join(consumerDir, 'xstyle-consumer-style.mjs'),
				transformedConsumer.code,
			);

			const renderScript = path.join(consumerDir, 'render-precedence.mjs');
			await writeFile(
				renderScript,
				[
					"import { createElement } from 'react';",
					"import { renderToStaticMarkup } from 'react-dom/server';",
					"import { Text } from '@luke-ui/react/text';",
					"import { consumerStyles } from './xstyle-consumer-style.mjs';",
					'',
					'function render(extraProps) {',
					'  return renderToStaticMarkup(',
					"    createElement(Text, { color: 'accent', xstyle: consumerStyles.override, ...extraProps }, 'Precedence'),",
					'  );',
					'}',
					'',
					'process.stdout.write(JSON.stringify({',
					'  xstyleOnlyMarkup: render({}),',
					"  withClassNameMarkup: render({ className: 'consumer-class' }),",
					'  withInlineStyleMarkup: render({',
					"    className: 'consumer-class',",
					"    style: { color: 'rgb(70, 80, 90)' },",
					'  }),',
					'}));',
				].join('\n'),
			);
			const { withClassNameMarkup, withInlineStyleMarkup, xstyleOnlyMarkup } = JSON.parse(
				execFileSync('node', [renderScript], {
					cwd: consumerDir,
					encoding: 'utf8',
					env: { PATH: process.env.PATH ?? '' },
				}),
			) as {
				withClassNameMarkup: string;
				withInlineStyleMarkup: string;
				xstyleOnlyMarkup: string;
			};
			expect(withClassNameMarkup).toContain('consumer-class');
			expect(withInlineStyleMarkup).toContain('color:rgb(70, 80, 90)');

			const [lukeStylesheetCss, lukeThemeCss] = await Promise.all([
				readFile(path.join(packedPackageRoot, 'dist/stylesheet.css'), 'utf8'),
				readFile(path.join(packedPackageRoot, 'dist/themes/tactile/stylesheet.css'), 'utf8'),
			]);

			const consumerClassNameCss =
				'@layer utilities { .consumer-class { color: rgb(40, 50, 60); } }';

			const declaredLayerOrder = '@layer reset, theme, base, recipes, overrides, utilities;';

			const documentCss = [
				declaredLayerOrder,
				lukeThemeCss,
				lukeStylesheetCss,
				consumerStylexCss,
				consumerClassNameCss,
			].join('\n');

			const themedAccentOnlyCss = [lukeThemeCss, lukeStylesheetCss].join('\n');
			const noXstyleMarkup = withClassNameMarkup.replace(' class="consumer-class"', '');

			browser = await chromium.launch();
			const page = await browser.newPage();

			await page.setContent(`<style>${themedAccentOnlyCss}</style>${noXstyleMarkup}`);
			const variantOnlyColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(variantOnlyColor).not.toBe('rgb(9, 9, 9)');

			const xstyleOverVariantCss = [lukeThemeCss, lukeStylesheetCss, consumerStylexCss].join('\n');
			await page.setContent(`<style>${xstyleOverVariantCss}</style>${xstyleOnlyMarkup}`);
			const xstyleOnlyColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(xstyleOnlyColor).toBe('rgb(9, 9, 9)');

			await page.setContent(`<style>${documentCss}</style>${withClassNameMarkup}`);
			const withClassNameColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(withClassNameColor).toBe('rgb(40, 50, 60)');

			await page.setContent(`<style>${documentCss}</style>${withInlineStyleMarkup}`);
			const withInlineStyleColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(withInlineStyleColor).toBe('rgb(70, 80, 90)');

			// Real consumer-compiled shorthand/LOGICAL-longhand overlap, resolved by a real browser
			// against the same `overrides` layer configuration `@luke-ui/vite` emits. `paddingLonghand`
			// is `paddingInlineStart`, so this proves the published contract's real shape for that
			// pairing: a later logical longhand wins over an earlier shorthand (tombstoned, as normal),
			// but the reverse does not hold — see `recipe-authoring.browser.test.tsx` for the in-repo proof
			// of the same StyleX 0.19.0 missing-tombstone defect, and its physical-longhand control case
			// that proves `application-order` otherwise does work in both directions.
			const overlapRenderScript = path.join(consumerDir, 'render-overlap.mjs');
			await writeFile(
				overlapRenderScript,
				[
					"import * as stylex from '@stylexjs/stylex';",
					"import { consumerStyles } from './xstyle-consumer-style.mjs';",
					'',
					'process.stdout.write(JSON.stringify({',
					'  longhandLastMarkup: stylex.props(consumerStyles.paddingShorthand, consumerStyles.paddingLonghand).className,',
					'  shorthandLastMarkup: stylex.props(consumerStyles.paddingLonghand, consumerStyles.paddingShorthand).className,',
					'}));',
				].join('\n'),
			);
			const { longhandLastMarkup, shorthandLastMarkup } = JSON.parse(
				execFileSync('node', [overlapRenderScript], {
					cwd: consumerDir,
					encoding: 'utf8',
					env: { PATH: process.env.PATH ?? '' },
				}),
			) as {
				longhandLastMarkup: string;
				shorthandLastMarkup: string;
			};

			await page.setContent(
				`<style>${consumerStylexCss}</style><div class="${longhandLastMarkup}"></div>`,
			);
			const longhandLastPadding = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).paddingLeft,
			);
			// A later logical longhand wins over an earlier overlapping shorthand: `padding`'s
			// tombstone set covers the physical `paddingLeft`/`paddingRight` keys, styleq drops the
			// earlier shorthand's class, and the surviving logical longhand class applies unopposed.
			expect(longhandLastPadding).toBe('4px');

			await page.setContent(
				`<style>${consumerStylexCss}</style><div class="${shorthandLastMarkup}"></div>`,
			);
			const shorthandLastPadding = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).paddingLeft,
			);
			// StyleX 0.19 does not emit a tombstone for `paddingInlineStart`, so styleq keeps both
			// classes and the priority tier returns `4px` instead of the correct `20px`. Related
			// regressions are covered by `test.fails` in `recipe-authoring.browser.test.tsx`.
			// REMOVAL CONDITION: when StyleX emits that tombstone, this assertion starts failing —
			// change the expected value to '20px' and delete this comment.
			expect(shorthandLastPadding).toBe('4px');

			await page.close();
		} finally {
			await browser?.close();
			await cleanup();
		}
	},
);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isExecFileError(
	value: unknown,
): value is { stderr?: Buffer | string; stdout?: Buffer | string } {
	return isRecord(value) && ('stderr' in value || 'stdout' in value);
}
