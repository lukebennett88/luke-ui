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
					"  accentClasses: textRecipe({ color: 'accent' }),",
					'  defaultClasses: textRecipe(),',
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

// The documented consumer layer configuration for authoring `xstyle` (see the "Cascade layers"
// section of the Styling guide and `docs/STYLING.md`): a dedicated `xstyle` sibling layer that
// sits above `recipes` but below `components` and `utilities`. This is the MINIMUM supported
// consumer configuration for the published `xstyle < className` precedence — with StyleX's
// default unlayered output, an unlayered consumer `xstyle` beats even a layered consumer
// `className`, and nesting consumer StyleX under the `recipes` parent layer is import-order
// dependent, so this test asserts the one configuration the docs actually recommend.
const DOCUMENTED_XSTYLE_LAYERS_BEFORE = ['reset', 'theme', 'base', 'recipes'];
const DOCUMENTED_XSTYLE_LAYERS_AFTER = ['components', 'utilities'];
const DOCUMENTED_XSTYLE_LAYER_PREFIX = 'xstyle';

test(
	'a real consumer StyleX compile proves the published xstyle precedence against real cascade resolution',
	{ timeout: 60_000 },
	async () => {
		// Mirrors the documented install command: an application authoring `xstyle` installs
		// `@stylexjs/stylex` directly, and does not rely on Luke UI's transitive copy.
		const { cleanup, consumerDir, packedPackageRoot } = await packAndLinkConsumer({
			consumerDependencies: ['@stylexjs/stylex'],
		});
		let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
		try {
			// The consumer authors its own `stylex.create()` value and compiles it with its OWN
			// `@babel/core` + `@stylexjs/babel-plugin` invocation — never through Luke UI's
			// `createStylexDevPlugin` — using the documented `useLayers` configuration. This is what
			// makes the coverage prove the PUBLIC contract rather than the in-repo dev-compiled path
			// `xstyle.browser.test.tsx` covers.
			const consumerSource = [
				"import * as stylex from '@stylexjs/stylex';",
				"export const consumerStyles = stylex.create({ override: { color: 'rgb(9, 9, 9)' } });",
			].join('\n');
			const transformedConsumer = await transformAsync(consumerSource, {
				babelrc: false,
				configFile: false,
				filename: path.join(consumerDir, 'xstyle-consumer-style.ts'),
				plugins: [
					stylexBabelPlugin.withOptions({
						dev: false,
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
					after: DOCUMENTED_XSTYLE_LAYERS_AFTER,
					before: DOCUMENTED_XSTYLE_LAYERS_BEFORE,
					prefix: DOCUMENTED_XSTYLE_LAYER_PREFIX,
				},
			});
			// Confirms the compile actually produced the documented `xstyle.priorityN` sibling layer,
			// not an unlayered or differently-prefixed rule — a false pass here would silently stop
			// proving the documented configuration.
			expect(consumerStylexCss).toContain(`@layer ${DOCUMENTED_XSTYLE_LAYER_PREFIX}.priority1`);
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

			// The real shipped stylesheet plus a real bundled theme, exactly as `layer-order.browser
			// .test.ts` verifies the in-repo build's layer order — read from the PACKED tarball, not
			// the workspace `dist`, so this proves what actually ships.
			const [lukeStylesheetCss, lukeThemeCss] = await Promise.all([
				readFile(path.join(packedPackageRoot, 'dist/stylesheet.css'), 'utf8'),
				readFile(path.join(packedPackageRoot, 'dist/themes/tactile/stylesheet.css'), 'utf8'),
			]);

			// The consumer's own `className` rule, declared in the `components` layer — a stand-in
			// for Tailwind, CSS Modules, or hand-authored application CSS placed in the layer the docs
			// recommend. It must beat `xstyle` (a sibling layer below `components`) but must itself
			// lose to inline `style`.
			const consumerClassNameCss =
				'@layer components { .consumer-class { color: rgb(40, 50, 60); } }';

			// The documented combined `@layer` order statement, declared before any stylesheet is
			// imported (see the "Cascade layers" section of the Styling guide). Without this, CSS's
			// own rule for cascade layers applies: a layer name gets its position from where it is
			// FIRST mentioned across the whole document, so `xstyle` — mentioned for the first time
			// only in the consumer's own compiled CSS, after the shipped stylesheet has already
			// registered `components` and `utilities` — would be appended after them instead of
			// between `recipes` and `components`. This statement is the reason that doesn't happen.
			const declaredLayerOrder =
				'@layer reset, theme, base, recipes, xstyle, components, utilities;';

			const documentCss = [
				declaredLayerOrder,
				lukeThemeCss,
				lukeStylesheetCss,
				consumerStylexCss,
				consumerClassNameCss,
			].join('\n');

			// Sanity-checks the fixture itself: the Tactile theme's accent foreground must actually
			// resolve to something other than the consumer override colour, otherwise "xstyle beats
			// the variant" would be a no-op instead of a real cascade override.
			const themedAccentOnlyCss = [lukeThemeCss, lukeStylesheetCss].join('\n');
			const noXstyleMarkup = withClassNameMarkup.replace(' class="consumer-class"', '');

			browser = await chromium.launch();
			const page = await browser.newPage();

			await page.setContent(`<style>${themedAccentOnlyCss}</style>${noXstyleMarkup}`);
			const variantOnlyColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(variantOnlyColor).not.toBe('rgb(9, 9, 9)');

			// 1. xstyle overrides the component variant.
			const xstyleOverVariantCss = [lukeThemeCss, lukeStylesheetCss, consumerStylexCss].join('\n');
			await page.setContent(`<style>${xstyleOverVariantCss}</style>${xstyleOnlyMarkup}`);
			const xstyleOnlyColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(xstyleOnlyColor).toBe('rgb(9, 9, 9)');

			// 2. consumer className overrides xstyle, because the documented `xstyle` layer sits
			// below `components`.
			await page.setContent(`<style>${documentCss}</style>${withClassNameMarkup}`);
			const withClassNameColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(withClassNameColor).toBe('rgb(40, 50, 60)');

			// 3. inline style overrides both className and xstyle.
			await page.setContent(`<style>${documentCss}</style>${withInlineStyleMarkup}`);
			const withInlineStyleColor = await page.evaluate(
				() => getComputedStyle(document.querySelector('[class]')!).color,
			);
			expect(withInlineStyleColor).toBe('rgb(70, 80, 90)');

			await page.close();
		} finally {
			await browser?.close();
			await cleanup();
		}
	},
);

// Matches the first declared `@layer` order statement in a stylesheet, e.g.
// `@layer reset, theme, base;`. Captures the comma-separated layer name list.
const LAYER_ORDER_STATEMENT_PATTERN = /@layer\s+([^{};]+);/;

// Matches a `prefix.priorityN` layer name, e.g. `xstyle.priority1`.
const XSTYLE_PRIORITY_LAYER_NAME_PATTERN = new RegExp(
	`^${DOCUMENTED_XSTYLE_LAYER_PREFIX}\\.priority\\d+$`,
);

// Pins the layer configuration the Styling guide's documented consumer Vite plugin declares (see
// the "Give `xstyle` its own layer" section) against the real StyleX compiler, so the published
// snippet and the cascade contract this repo ships cannot drift apart silently. The end-to-end
// cascade behaviour itself — that a consumer's `xstyle` really does sit between `recipes` and
// `components` in real browser resolution — is covered by the test above; this test only proves
// that `LAYER_CONFIG` as documented produces the expected layer names and rule wrapping.
test('the documented consumer Vite plugin layer config emits the xstyle sibling layer', async () => {
	const consumerSource = [
		"import * as stylex from '@stylexjs/stylex';",
		'export const consumerStyles = stylex.create({',
		"  override: { color: 'rgb(9, 9, 9)', paddingBlockStart: '4px' },",
		'});',
	].join('\n');
	const transformedConsumer = await transformAsync(consumerSource, {
		babelrc: false,
		configFile: false,
		filename: path.join(packageRoot, 'xstyle-layer-config-consumer-style.ts'),
		plugins: [
			stylexBabelPlugin.withOptions({
				dev: false,
				unstable_moduleResolution: { type: 'commonJS', rootDir: packageRoot },
			}),
		],
	});
	if (transformedConsumer?.code == null) throw new Error('Expected the consumer StyleX transform.');
	const consumerRules = (
		transformedConsumer.metadata as {
			stylex?: Parameters<typeof stylexBabelPlugin.processStylexRules>[0];
		}
	).stylex;
	if (consumerRules === undefined) throw new Error('Expected consumer StyleX rules.');

	const layeredCss = stylexBabelPlugin.processStylexRules(consumerRules, {
		useLayers: {
			after: DOCUMENTED_XSTYLE_LAYERS_AFTER,
			before: DOCUMENTED_XSTYLE_LAYERS_BEFORE,
			prefix: DOCUMENTED_XSTYLE_LAYER_PREFIX,
		},
	});

	const layerOrderMatch = LAYER_ORDER_STATEMENT_PATTERN.exec(layeredCss);
	const layerOrderNameList = layerOrderMatch?.[1];
	if (layerOrderNameList === undefined) {
		throw new Error(`Expected a "@layer ...;" order statement in:\n${layeredCss}`);
	}
	const layerNames = layerOrderNameList.split(',').map((name) => name.trim());

	const xstyleLayerNames = layerNames.filter((name) =>
		XSTYLE_PRIORITY_LAYER_NAME_PATTERN.test(name),
	);
	const beforeNames = layerNames.slice(0, DOCUMENTED_XSTYLE_LAYERS_BEFORE.length);
	const afterNames = layerNames.slice(layerNames.length - DOCUMENTED_XSTYLE_LAYERS_AFTER.length);
	const middleNames = layerNames.slice(
		DOCUMENTED_XSTYLE_LAYERS_BEFORE.length,
		layerNames.length - DOCUMENTED_XSTYLE_LAYERS_AFTER.length,
	);

	expect(beforeNames).toEqual(DOCUMENTED_XSTYLE_LAYERS_BEFORE);
	expect(afterNames).toEqual(DOCUMENTED_XSTYLE_LAYERS_AFTER);
	expect(middleNames.length).toBeGreaterThan(0);
	for (const name of middleNames) {
		expect(name.startsWith(`${DOCUMENTED_XSTYLE_LAYER_PREFIX}.priority`)).toBe(true);
	}
	// Proves the prefix applies across more than one StyleX priority, not just the first.
	expect(xstyleLayerNames.length).toBeGreaterThanOrEqual(2);

	// Every rule block is wrapped in the prefixed sibling layer, not left unlayered and not nested
	// under `recipes`.
	for (const xstyleLayerName of xstyleLayerNames) {
		expect(layeredCss).toContain(`@layer ${xstyleLayerName}{`);
	}

	// Guards against a vacuous pass: the plain boolean `useLayers: true` form — what
	// `@stylexjs/unplugin` and `@stylexjs/postcss-plugin` use — does NOT produce the `xstyle`
	// prefix. It emits bare `@layer priorityN` names instead, which is exactly why those official
	// integrations cannot satisfy this contract and the docs point at a hand-rolled plugin instead.
	const unprefixedCss = stylexBabelPlugin.processStylexRules(consumerRules, { useLayers: true });
	expect(unprefixedCss).not.toContain(DOCUMENTED_XSTYLE_LAYER_PREFIX);
	const unprefixedLayerOrderMatch = LAYER_ORDER_STATEMENT_PATTERN.exec(unprefixedCss);
	const unprefixedLayerOrderNameList = unprefixedLayerOrderMatch?.[1];
	if (unprefixedLayerOrderNameList === undefined) {
		throw new Error(`Expected a "@layer ...;" order statement in:\n${unprefixedCss}`);
	}
	const unprefixedLayerNames = unprefixedLayerOrderNameList.split(',').map((name) => name.trim());
	expect(unprefixedLayerNames.length).toBeGreaterThanOrEqual(2);
	for (const name of unprefixedLayerNames) {
		expect(name.startsWith('priority')).toBe(true);
	}
});

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isExecFileError(
	value: unknown,
): value is { stderr?: Buffer | string; stdout?: Buffer | string } {
	return isRecord(value) && ('stderr' in value || 'stdout' in value);
}
