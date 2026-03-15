import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { babel } from '@rollup/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'tsdown';
import { entries } from './.generated/entries.js';
import packageJson from './package.json' with { type: 'json' };

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));

export default defineConfig((options) => ({
	attw: {
		entrypoints: [
			...Object.keys(entries)
				.filter((k) => k !== 'styles')
				.map((k) => `./${k}`),
			'./package.json',
		],
		profile: 'esm-only',
	},
	deps: {
		neverBundle: Object.keys(packageJson.peerDependencies),
	},
	dts: true,
	entry: entries,
	exports: {
		customExports: (exportsField) => {
			// Remove internal-only entries from public exports
			const { './styles': _, ...publicExports } = exportsField;
			return {
				...publicExports,
				'./spritesheet.svg': './dist/spritesheet.svg',
				'./stylesheet.css': './dist/stylesheet.css',
			};
		},
	},
	format: ['esm'],
	outputOptions: {
		assetFileNames: '[name][extname]',
	},
	hooks: {
		'build:before': async () => {
			execSync('pnpm run generate', { stdio: 'inherit' });
		},
	},
	platform: 'neutral',
	plugins: [
		vanillaExtractPlugin({
			cwd: workspaceRoot,
			extract: { name: 'stylesheet.css', sourcemap: true },
			identifiers: 'short',
		}),
		babel({
			babelHelpers: 'bundled',
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			parserOpts: {
				plugins: ['jsx', 'typescript'],
				sourceType: 'module',
			},
			plugins: ['babel-plugin-react-compiler'],
		}),
		...(options.watch
			? [
					// @ts-expect-error Vite plugin compatibility
					react({ fastRefresh: true }),
				]
			: []),
	],
	publint: true,
	sourcemap: true,
	...options,
}));
