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

/**
 * Packs the real tarball and wires a throwaway consumer directory that symlinks only the
 * package's declared runtime dependencies (no workspace config, no NODE_PATH), so anything the
 * consumer script imports has to resolve the way a real installed consumer's would. Returns the
 * consumer directory and the packed package root; the caller is responsible for cleanup of both
 * `tarballDir`/`consumerDir` return values via the `cleanup` function.
 */
async function packAndLinkConsumer(): Promise<{
	cleanup: () => Promise<void>;
	consumerDir: string;
	packedPackageRoot: string;
}> {
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
	const runtimeDependencies = new Set([
		...Object.keys(packedPackageJson.dependencies),
		...Object.keys(packedPackageJson.peerDependencies),
	]);
	const consumerNodeModules = path.join(consumerDir, 'node_modules');
	await mkdir(path.join(consumerNodeModules, '@luke-ui'), { recursive: true });
	await symlink(packedPackageRoot, path.join(consumerNodeModules, '@luke-ui', 'react'));

	await Promise.all(
		[...runtimeDependencies].map(async (dependency) => {
			const dependencyDir = path.dirname(
				require.resolve(`${dependency}/package.json`, { paths: [packageRoot] }),
			);
			const linkPath = path.join(consumerNodeModules, dependency);
			await mkdir(path.dirname(linkPath), { recursive: true });
			await symlink(dependencyDir, linkPath);
		}),
	);

	await writeFile(
		path.join(consumerDir, 'package.json'),
		JSON.stringify({ name: 'packed-consumer-fixture', private: true, type: 'module' }),
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
		const tarballDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-react-pack-'));
		const consumerDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-react-consumer-'));
		try {
			const tarballName = execFileSync(
				'npm',
				['pack', '--silent', '--pack-destination', tarballDir],
				{ cwd: packageRoot, encoding: 'utf8' },
			).trim();
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
			const runtimeDependencies = new Set([
				...Object.keys(packedPackageJson.dependencies),
				...Object.keys(packedPackageJson.peerDependencies),
			]);
			const consumerNodeModules = path.join(consumerDir, 'node_modules');
			await mkdir(path.join(consumerNodeModules, '@luke-ui'), { recursive: true });
			await symlink(packedPackageRoot, path.join(consumerNodeModules, '@luke-ui', 'react'));

			await Promise.all(
				[...runtimeDependencies].map(async (dependency) => {
					const dependencyDir = path.dirname(
						require.resolve(`${dependency}/package.json`, { paths: [packageRoot] }),
					);
					const linkPath = path.join(consumerNodeModules, dependency);
					await mkdir(path.dirname(linkPath), { recursive: true });
					await symlink(dependencyDir, linkPath);
				}),
			);

			await writeFile(
				path.join(consumerDir, 'package.json'),
				JSON.stringify({ name: 'packed-consumer-fixture', private: true, type: 'module' }),
			);
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
			await rm(tarballDir, { force: true, recursive: true });
			await rm(consumerDir, { force: true, recursive: true });
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
		const { cleanup, consumerDir, packedPackageRoot } = await packAndLinkConsumer();
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
