import { execFileSync, spawnSync } from 'node:child_process';

const globs = ['*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs'];

function git(...args: Array<string>) {
	return execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
}

const mergeBase = git('merge-base', 'origin/main', 'HEAD')[0];
const files = new Set([
	...git('diff', '--name-only', '--diff-filter=d', mergeBase, '--', ...globs),
	...git('ls-files', '--others', '--exclude-standard', '--', ...globs),
]);

if (files.size === 0) {
	console.log('lint:changed: no changed JS/TS files.');
	process.exit(0);
}

const result = spawnSync('pnpm', ['exec', 'vp', 'lint', '--deny', 'no-nested-ternary', ...files], {
	stdio: 'inherit',
});
process.exit(result.status ?? 1);
