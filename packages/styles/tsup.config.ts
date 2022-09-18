import { getPackageInfo } from '@luke-ui-internal/dev/tsup.js';
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

type TsupConfig = ReturnType<typeof defineConfig>;

const packageInfo = getPackageInfo(__dirname);

const tsupConfig: TsupConfig = defineConfig((options) => {
	const entry = ['src/index.ts'];
	const external = ['react', 'react-dom'];
	const banner = createBanner(packageInfo);
	const esbuildPlugins = [
		vanillaExtractPlugin({
			identifiers: options.watch ? 'debug' : 'short',
		}),
	];

	return [
		// cjs.dev.js
		{
			banner: { js: banner },
			clean: !options.watch,
			define: { __DEV__: 'true' },
			entry,
			esbuildPlugins,
			external,
			format: 'cjs',
			outExtension: getOutExtension('dev'),
			sourcemap: true,
			splitting: false,
			target: 'es2016',
		},

		// cjs.prod.js
		{
			banner: { js: banner },
			clean: !options.watch,
			define: { __DEV__: 'false' },
			drop: ['console'],
			dts: true,
			entry,
			esbuildPlugins,
			external,
			format: 'cjs',
			minify: true,
			minifySyntax: true,
			outExtension: getOutExtension('prod'),
			splitting: false,
			target: 'es2016',
		},

		// esm
		{
			banner: { js: banner },
			clean: !options.watch,
			define: { __DEV__: 'true' },
			dts: { banner },
			entry,
			esbuildPlugins,
			external,
			format: 'esm',
			splitting: false,
			target: 'es2020',
		},
	];
});

function getOutExtension(env: 'dev' | 'prod'): Options['outExtension'] {
	return ({ format }) => ({ js: `.${format}.${env}.js` });
}

function createBanner({
	packageAuthor,
	packageName,
	packageVersion,
}: {
	packageAuthor: string;
	packageName: string;
	packageVersion: string;
}) {
	return `
/**
 * @license MIT
 *
 * ${packageName} v${packageVersion}
 *
 * Copyright (c) ${packageAuthor}
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */`.trim();
}

export default tsupConfig;
