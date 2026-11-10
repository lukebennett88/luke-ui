/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Builds one consumer for every app: the client bundle, the SSR bundle, and a prerendered
// `index.html` the client hydrates. Run from a consumer directory: `node ../build-app.mjs [app]`.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const apps = process.argv[2] ? [process.argv[2]] : ['minimal', 'realistic', 'tailwind'];
const cwd = process.cwd();
const vite = join(cwd, 'node_modules', '.bin', 'vite');

for (const app of apps) {
	const env = { ...process.env, APP: app };
	rmSync(join(cwd, 'dist', app), { force: true, recursive: true });
	execFileSync(vite, ['build', '--logLevel', 'warn'], { cwd, env, stdio: 'inherit' });
	execFileSync(
		vite,
		[
			'build',
			'--logLevel',
			'warn',
			'--ssr',
			'../shared/src/server.tsx',
			'--outDir',
			`dist/${app}-ssr`,
		],
		{
			cwd,
			env,
			stdio: 'inherit',
		},
	);
	const { render } = await import(pathToFileURL(join(cwd, 'dist', `${app}-ssr`, 'server.js')).href);
	const htmlPath = join(cwd, 'dist', app, 'index.html');
	writeFileSync(htmlPath, readFileSync(htmlPath, 'utf8').replace('<!--app-->', render()));
	console.log(`${app}: built and prerendered`);
}
