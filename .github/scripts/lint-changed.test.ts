import { execFileSync, spawnSync } from 'node:child_process';
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vite-plus/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lintChanged =
	(
		JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
			scripts: Record<string, string>;
		}
	).scripts['lint:changed'] ?? '';

const good = 'export const pick = (a: number) => (a > 1 ? 1 : 2);\n';
const nestedTernary = 'export const pick = (a: number) => (a > 1 ? 1 : a > 0 ? 2 : 3);\n';

const fixtures: Array<string> = [];

afterEach(() => {
	for (const fixture of fixtures.splice(0)) rmSync(fixture, { force: true, recursive: true });
});

const env: NodeJS.ProcessEnv = {
	...process.env,
	GIT_CONFIG_GLOBAL: '/dev/null',
	GIT_CONFIG_NOSYSTEM: '1',
	PATH: `${path.join(root, 'node_modules/.bin')}${path.delimiter}${process.env.PATH ?? ''}`,
};
for (const name of ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE']) delete env[name];

function git(cwd: string, ...args: Array<string>) {
	return execFileSync(
		'git',
		[
			'-c',
			'user.name=Test',
			'-c',
			'user.email=test@example.com',
			'-c',
			'commit.gpgsign=false',
			...args,
		],
		{ cwd, encoding: 'utf8', env },
	);
}

/** A throwaway repo whose `origin/main` is its first commit and whose `staged` config is the real one. */
function createFixture() {
	const cwd = realpathSync(mkdtempSync(path.join(tmpdir(), 'lint-changed-')));
	fixtures.push(cwd);
	git(cwd, 'init', '-q', '-b', 'main');
	writeFileSync(
		path.join(cwd, 'vite.config.ts'),
		`export { default } from ${JSON.stringify(path.join(root, 'vite.config.ts'))};\n`,
	);
	writeFileSync(path.join(cwd, 'package.json'), '{"name":"fixture","private":true}\n');
	symlinkSync(path.join(root, 'node_modules'), path.join(cwd, 'node_modules'), 'dir');
	mkdirSync(path.join(cwd, 'src'));
	writeFileSync(path.join(cwd, 'src/tracked.ts'), good);
	git(cwd, 'add', '.');
	git(cwd, 'commit', '-q', '-m', 'base');
	git(cwd, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
	git(cwd, 'switch', '-q', '-c', 'feature');
	return cwd;
}

function run(cwd: string) {
	const result = spawnSync('sh', ['-c', lintChanged], { cwd, encoding: 'utf8', env });
	return { output: `${result.stdout}${result.stderr}`, status: result.status };
}

test('fails on a nested ternary in a committed change', () => {
	const cwd = createFixture();
	writeFileSync(path.join(cwd, 'src/committed.ts'), nestedTernary);
	git(cwd, 'add', '.');
	git(cwd, 'commit', '-q', '-m', 'add');
	const { output, status } = run(cwd);
	expect(status).toBe(1);
	expect(output).toContain('committed.ts');
});

test('fails on a nested ternary in a staged new file', () => {
	const cwd = createFixture();
	writeFileSync(path.join(cwd, 'src/staged.ts'), nestedTernary);
	git(cwd, 'add', 'src/staged.ts');
	const { output, status } = run(cwd);
	expect(status).toBe(1);
	expect(output).toContain('staged.ts');
});

test('fails on a nested ternary in an unstaged edit to a tracked file', () => {
	const cwd = createFixture();
	writeFileSync(path.join(cwd, 'src/tracked.ts'), nestedTernary);
	const { output, status } = run(cwd);
	expect(status).toBe(1);
	expect(output).toContain('tracked.ts');
});

test('passes a change without a nested ternary', () => {
	const cwd = createFixture();
	writeFileSync(path.join(cwd, 'src/tracked.ts'), `${good}export const other = 1;\n`);
	const { output, status } = run(cwd);
	expect(status).toBe(0);
	expect(output).toContain('vp lint --deny no-nested-ternary');
});

test('exits 0 without linting when nothing changed', () => {
	const cwd = createFixture();
	const { output, status } = run(cwd);
	expect(status).toBe(0);
	expect(output).toContain('could not find any staged files');
});

test('skips an untracked file until it is added', () => {
	const cwd = createFixture();
	writeFileSync(path.join(cwd, 'src/untracked.ts'), nestedTernary);
	const { output, status } = run(cwd);
	expect(status).toBe(0);
	expect(output).toContain('could not find any staged files');
});
