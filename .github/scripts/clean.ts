import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const isBuild = process.argv.includes('--build');

const directories = [
	'.',
	...readdirSync(join(root, 'apps'), { withFileTypes: true }).flatMap((entry) => {
		if (!entry.isDirectory()) return [];
		return [`apps/${entry.name}`];
	}),
	'.github/scripts',
	...readdirSync(join(root, 'packages'), { withFileTypes: true }).flatMap((entry) => {
		if (!entry.isDirectory() || entry.name === '@luke-ui') return [];
		return [`packages/${entry.name}`];
	}),
	...readdirSync(join(root, 'packages/@luke-ui'), { withFileTypes: true }).flatMap((entry) => {
		if (!entry.isDirectory()) return [];
		return [`packages/@luke-ui/${entry.name}`];
	}),
];
const outputs = ['dist', '.output', '.source', '.tanstack', '.generated'];
const caches = ['.turbo', '.vite', '.vite-plus', '.vitest', '.vitest-attachments', 'node_modules'];
for (const directory of directories) {
	for (const name of isBuild ? outputs : [...outputs, ...caches]) {
		rmSync(join(root, directory, name), { recursive: true, force: true });
	}
}
for (const output of [
	'apps/docs/src/generated',
	'apps/docs/src/routeTree.gen.ts',
	'packages/@luke-ui/react/.visual-captures',
	'packages/@luke-ui/react/screenshots',
]) {
	rmSync(join(root, output), { recursive: true, force: true });
}
if (!isBuild) rmSync(join(root, '.artifacts'), { recursive: true, force: true });
