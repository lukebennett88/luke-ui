import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vite-plus/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const packageRequire = createRequire(import.meta.url);
const tsxCli = packageRequire.resolve('tsx/cli');
const generatorScript = path.join(__dirname, 'generate.ts');

describe('scaffolding CLI', () => {
	test('lists the component plan without writing files', () => {
		const result = runGenerator('component', '--args', 'SampleCard', 'layout', 'No', '--dry-run');

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Would create 6 files:');
		expect(result.stdout).toContain('packages/@luke-ui/react/src/core/sample-card/sample-card.tsx');
		expect(result.stderr).toBe('');
	});

	test('lists the primitive plan without writing files', () => {
		const result = runGenerator('primitive', '--args', 'SamplePrimitive', 'No', 'No', '--dry-run');

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Would create 4 files:');
		expect(result.stderr).toBe('');
	});

	test('requires arguments when no interactive terminal is available', () => {
		const result = runGenerator('component');

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Pass scaffold options with --args');
	});

	test('reports invalid scripted arguments without writing files', () => {
		const result = runGenerator('primitive', '--args', 'Bad Name', 'Maybe', 'No', '--dry-run');

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Expected Yes or No, received Maybe');
	});

	test('preserves scaffold name validation', () => {
		const result = runGenerator('component', '--args', 'Bad Name', 'layout', 'No', '--dry-run');

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Use letters/numbers/hyphens. Start with a letter.');
	});

	test('preserves component docs group validation', () => {
		const result = runGenerator(
			'component',
			'--args',
			'SampleCard',
			'primitives',
			'No',
			'--dry-run',
		);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Invalid option');
	});

	test('refuses to overwrite an existing component scaffold', () => {
		const result = runGenerator('component', '--args', 'Button', 'actions', 'No');

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			'Cannot scaffold because packages/@luke-ui/react/src/core/button/button.tsx already exists.',
		);
	});
});

function runGenerator(
	kind: 'component' | 'primitive',
	...args: Array<string | { input: string }>
): ReturnType<typeof spawnSync> {
	const inputOption = args.find((arg): arg is { input: string } => typeof arg !== 'string');
	const commandArgs = args.filter((arg): arg is string => typeof arg === 'string');
	return spawnSync(process.execPath, [tsxCli, generatorScript, kind, ...commandArgs], {
		cwd: root,
		encoding: 'utf8',
		input: inputOption?.input,
		timeout: 10_000,
	});
}
