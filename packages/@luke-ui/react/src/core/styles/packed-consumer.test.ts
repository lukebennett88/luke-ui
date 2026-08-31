import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));

const runtimeDependencies = [
	'react',
	'react-dom',
	'react-aria-components',
	'@capsizecss/metrics',
	'@capsizecss/vanilla-extract',
	'@luke-ui/rainbow-sprinkles',
	'@react-aria/utils',
	'@stylexjs/stylex',
	'@vanilla-extract/css',
	'@vanilla-extract/recipes',
] as const;

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
			const consumerNodeModules = path.join(consumerDir, 'node_modules');
			await mkdir(path.join(consumerNodeModules, '@luke-ui'), { recursive: true });
			await symlink(
				path.join(consumerDir, 'package'),
				path.join(consumerNodeModules, '@luke-ui', 'react'),
			);

			await Promise.all(
				runtimeDependencies.map(async (dependency) => {
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
		} finally {
			await rm(tarballDir, { force: true, recursive: true });
			await rm(consumerDir, { force: true, recursive: true });
		}
	},
);
