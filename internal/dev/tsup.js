/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('tsup');

function getTsupConfig(
	entry,
	{ external = [], packageAuthor, packageName, packageVersion }
) {
	entry = Array.isArray(entry) ? entry : [entry];
	external = [...new Set(['react', 'react-dom']), ...external];
	const banner = createBanner(packageAuthor, packageName, packageVersion);
	return defineConfig([
		// cjs.dev.js
		{
			banner: { js: banner },
			define: { __DEV__: 'true' },
			entry,
			external,
			format: 'cjs',
			outExtension: getOutExtension('dev'),
			sourcemap: true,
			target: 'es2016',
		},

		// cjs.prod.js
		{
			define: { __DEV__: 'false' },
			drop: ['console'],
			entry,
			external,
			format: 'cjs',
			minify: true,
			minifySyntax: true,
			outExtension: getOutExtension('prod'),
			pure: ['warning'],
			target: 'es2016',
		},

		// esm
		{
			banner: { js: banner },
			define: { __DEV__: 'true' },
			dts: { banner },
			entry,
			external,
			format: 'esm',
			target: 'es2020',
		},
	]);
}

/**
 * @param {"dev" | "prod"} env
 */
function getOutExtension(env) {
	return ({ format }) => ({ js: `.${format}.${env}.js` });
}

/**
 * @param {string} packageName
 * @param {string} packageVersion
 */
function createBanner(packageAuthor, packageName, packageVersion) {
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

function getPackageInfo(packageRoot) {
	const packageJson = fs.readFileSync(
		path.join(packageRoot, 'package.json'),
		'utf8'
	);
	const { version, name, author } = JSON.parse(packageJson);
	const [packageAuthor] = author.split(' <');
	return {
		packageAuthor,
		packageName: name,
		packageVersion: version,
	};
}

module.exports = {
	getTsupConfig,
	getPackageInfo,
};
