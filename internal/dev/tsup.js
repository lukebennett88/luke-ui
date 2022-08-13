const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('tsup');

function getTsupConfig(entry, { packageName, packageVersion, external = [] }) {
	entry = Array.isArray(entry) ? entry : [entry];
	external = [...new Set(['react', 'react-dom']), ...external];
	const banner = createBanner(packageName, packageVersion);
	return defineConfig([
		// cjs.dev.js
		{
			entry,
			format: 'cjs',
			sourcemap: true,
			outExtension: getOutExtension('dev'),
			external,
			banner: { js: banner },
			define: {
				__DEV__: 'true',
			},
			target: 'es2016',
		},

		// cjs.prod.js
		{
			entry,
			format: 'cjs',
			minify: true,
			minifySyntax: true,
			outExtension: getOutExtension('prod'),
			external,
			pure: ['warning'],
			// @ts-ignore
			drop: ['console'],
			define: {
				__DEV__: 'false',
			},
			target: 'es2016',
		},

		// esm
		{
			entry,
			dts: { banner },
			format: 'esm',
			external,
			banner: { js: banner },
			define: {
				__DEV__: 'true',
			},
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
 * @param {string} version
 */
function createBanner(packageName, version) {
	return `/**
  * ${packageName} v${version}
  *
  * Copyright (c) Luke Bennett
  *
  * This source code is licensed under the MIT license found in the
  * LICENSE.md file in the root directory of this source tree.
  *
  * @license MIT
  */
`;
}

function getPackageInfo(packageRoot) {
	const packageJson = fs.readFileSync(
		path.join(packageRoot, 'package.json'),
		'utf8'
	);
	const { version, name } = JSON.parse(packageJson);
	return { version, name };
}

module.exports = {
	getTsupConfig,
	getPackageInfo,
};
