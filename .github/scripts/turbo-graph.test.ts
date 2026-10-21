import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vite-plus/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

type Task = {
	taskId: string;
	dependencies: Array<string>;
	resolvedTaskDefinition: { cache: boolean };
};

function plan(tasks: Array<string>): Array<Task> {
	const output = execFileSync(
		process.execPath,
		[path.join(root, 'node_modules/turbo/bin/turbo'), 'run', ...tasks, '--dry=json'],
		{
			cwd: root,
			encoding: 'utf8',
		},
	);
	return (JSON.parse(output) as { tasks: Array<Task> }).tasks;
}

test('app tests prepare generated inputs and upstream packages from a clean checkout', () => {
	const tasks = plan(['test', 'test:consumer:run', 'test:integration']);
	expect(tasks.find(({ taskId }) => taskId === 'reference-app#test')?.dependencies).toContain(
		'@luke-ui/react#build',
	);
	expect(tasks.find(({ taskId }) => taskId === 'docs#test')?.dependencies).toContain(
		'docs#generate',
	);
	expect(tasks.find(({ taskId }) => taskId === '@luke-ui/react#test')?.dependencies).toContain(
		'@luke-ui/theme-tactile#build',
	);
	expect(tasks.map(({ taskId }) => taskId)).not.toContain('docs#build');
	expect(tasks.map(({ taskId }) => taskId)).not.toContain('reference-app#build');
	for (const task of tasks.filter(({ taskId }) => taskId.endsWith('#test'))) {
		expect(task).toMatchObject({ resolvedTaskDefinition: { cache: false } });
	}
});

test('focused suites resolve their prerequisites and never reuse test results', () => {
	const tasks = plan([
		'test:unit',
		'test:browser:run',
		'test:consumer:run',
		'test:integration',
		'test:visual:run',
		'test:visual:capture:run',
		'test:watch:run',
		'test:ui:run',
		'--filter=@luke-ui/react',
		'--filter=@luke-ui/theme-build',
	]);
	const consumer = tasks.find(({ taskId }) => taskId === '@luke-ui/react#test:consumer:run');
	expect(consumer?.dependencies).toEqual(
		expect.arrayContaining([
			'@luke-ui/react#build',
			'@luke-ui/theme-paper#build',
			'@luke-ui/theme-tactile#build',
		]),
	);
	for (const task of tasks.filter(({ taskId }) => taskId.includes('#test:'))) {
		expect(task).toMatchObject({ resolvedTaskDefinition: { cache: false } });
	}
});

test('barrel checks wait for the public dist imports they inspect', () => {
	const tasks = plan(['check:barrels']);
	expect(
		tasks.find(({ taskId }) => taskId === '@luke-ui/react#check:barrels')?.dependencies,
	).toContain('@luke-ui/react#build');
});

test('focused checks and fixes remain runnable with safe prerequisite ordering', () => {
	const tasks = plan([
		'check:format',
		'check:lint',
		'fix:format',
		'fix:lint',
		'fix:lint:unsafe',
		'fix:lint:types',
		'fix:lint:types:unsafe',
		'--filter=@luke-ui/react',
	]);
	for (const task of tasks.filter(({ taskId }) => taskId.includes('#fix:'))) {
		expect(task).toMatchObject({ resolvedTaskDefinition: { cache: false } });
	}
	for (const task of tasks.filter(({ taskId }) => taskId.includes('#fix:lint:types'))) {
		expect(task.dependencies).toContain('@luke-ui/react#build');
	}
});
