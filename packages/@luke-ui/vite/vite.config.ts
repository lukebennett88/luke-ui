import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { defineConfig } from 'vite-plus';

const distDir = fileURLToPath(new URL('dist/', import.meta.url));
const stylesheetSource = fileURLToPath(new URL('src/stylesheet.css', import.meta.url));
const stylesheetDist = fileURLToPath(new URL('dist/stylesheet.css', import.meta.url));
const preservedDistFiles = new Set(['stylesheet.css']);

export default defineConfig({
	pack: {
		attw: {
			excludeEntrypoints: ['./stylesheet.css'],
			profile: 'esm-only',
		},
		clean: false,
		deps: {
			neverBundle: ['@babel/core', '@stylexjs/babel-plugin', 'vite'],
		},
		dts: true,
		entry: {
			index: 'src/index.ts',
		},
		exports: {
			customExports: {
				'./stylesheet.css': './dist/stylesheet.css',
			},
		},
		format: ['esm'],
		hooks: {
			'build:prepare': async () => {
				await cleanDistExceptPreservedFiles();
				await mkdir(distDir, { recursive: true });
				await copyFile(stylesheetSource, stylesheetDist);
			},
		},
		platform: 'node',
		publint: true,
		sourcemap: true,
	},
});

async function cleanDistExceptPreservedFiles() {
	let entries: Array<string>;
	try {
		entries = await readdir(distDir);
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return;
		}
		throw error;
	}
	await Promise.all(
		entries.flatMap((entry) => {
			if (preservedDistFiles.has(entry)) return [];
			return [rm(join(distDir, entry), { force: true, recursive: true })];
		}),
	);
}
