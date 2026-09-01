import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));

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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
