import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { needsVisualComparison, SAFE_PROSE_PATHS } from './visual-impact.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

test('only proven prose changes skip visual comparison', () => {
	expect(needsVisualComparison(['README.md', 'docs/TESTING.md', 'AGENTS.md'])).toBe(false);
	for (const paths of [undefined, [], [''], ['docs/new-guide.md'], ['.changeset/new.md']]) {
		expect(needsVisualComparison(paths)).toBe(true);
	}
	expect(
		needsVisualComparison([...Array.from({ length: 300 }, () => 'README.md'), 'vite.config.ts']),
	).toBe(true);
});

for (const file of [
	'vite.config.ts',
	'pnpm-lock.yaml',
	'packages/@luke-ui/react/vite.config.ts',
	'packages/@luke-ui/tactile/src/theme.ts',
	'packages/@luke-ui/react/src/theme/__fixtures__/paper.ts',
	'packages/@luke-ui/react/src/core/test-utils/render.tsx',
	'packages/@luke-ui/react/src/core/button/button.browser.test.tsx',
	'.github/workflows/visual-regression.yml',
	'.github/scripts/visual-impact.ts',
	'apps/docs/content/docs/components/button.mdx',
]) {
	test(`compares rendering inputs and uncertain paths: ${file}`, () => {
		expect(needsVisualComparison(['README.md', file])).toBe(true);
	});
}

test('renames count both paths and deletions retain their impact', () => {
	expect(needsVisualComparison(['docs/TESTING.md', 'vite.config.ts'])).toBe(true);
	expect(needsVisualComparison(['vite.config.ts', 'docs/TESTING.md'])).toBe(true);
	expect(needsVisualComparison(['vite.config.ts'])).toBe(true);
	expect(needsVisualComparison(['docs/TESTING.md'])).toBe(false);
});

test('baseline filters match the finite prose policy without the 300-file truncation risk', async () => {
	const workflow = await readFile(
		path.join(repoRoot, '.github/workflows/visual-baseline.yml'),
		'utf8',
	);
	const ignored = workflow.split('    paths-ignore:\n')[1]?.split('  workflow_dispatch:')[0];
	expect(ignored).toBeDefined();
	const paths = ignored
		?.trim()
		.split('\n')
		.map((line) => line.trim().slice(2));
	expect(paths).toEqual([...SAFE_PROSE_PATHS]);
	expect(new Set(paths).size).toBeLessThan(300);
	for (const file of paths ?? []) {
		expect(['*', '?', '[', ']', '{', '}', '!'].some((character) => file.includes(character))).toBe(
			false,
		);
		expect(file.endsWith('.md')).toBe(true);
	}
	expect(workflow).toContain('  workflow_dispatch:\n');
	expect(workflow).not.toContain('needs: impact');
});

test('the PR workflow always reports the gate and checks impact before starting its container', async () => {
	const workflow = await readFile(
		path.join(repoRoot, '.github/workflows/visual-regression.yml'),
		'utf8',
	);
	expect(workflow).toContain('  pull_request:\n  workflow_dispatch:');
	const impact = workflow.split('  impact:\n')[1]?.split('  compare:')[0];
	expect(impact).toContain('node .github/scripts/visual-impact.ts');
	for (const expensiveStep of ['pnpm', 'container:', 'download-artifact']) {
		expect(impact).not.toContain(expensiveStep);
	}
	expect(workflow).toContain("if: needs.impact.outputs.required == 'true'");
	expect(workflow).toContain('needs: [impact, compare, review]');
	expect(workflow).toContain('IMPACT: ${{ needs.impact.result }}');
	expect(workflow).toContain('REQUIRED: ${{ needs.impact.outputs.required }}');
	expect(workflow).toContain('  gate:\n    name: visual-regression\n    if: always()');
});

test('native impact detection checks full git history, including renamed and deleted files', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-impact-'));
	const git = (...args: Array<string>) => {
		return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
	};
	git('init', '--quiet');
	git('config', 'user.email', 'test@example.com');
	git('config', 'user.name', 'Test');
	git('config', 'commit.gpgsign', 'false');
	await writeFile(path.join(root, 'vite.config.ts'), 'export default {};\n');
	await writeFile(path.join(root, 'README.md'), 'Guide\n');
	git('add', '.');
	git('commit', '--quiet', '-m', 'initial');
	const base = git('rev-parse', 'HEAD');
	const script = fileURLToPath(new URL('./visual-impact.ts', import.meta.url));
	const output = path.join(root, 'output');
	const eventPath = path.join(root, 'event.json');
	async function detect(head: string, baseSha = base) {
		await writeFile(output, '');
		await writeFile(
			eventPath,
			JSON.stringify({ pull_request: { base: { sha: baseSha }, head: { sha: head } } }),
		);
		execFileSync(process.execPath, [script], {
			cwd: root,
			env: { ...process.env, GITHUB_EVENT_PATH: eventPath, GITHUB_OUTPUT: output },
			stdio: 'pipe',
		});
		return readFile(output, 'utf8');
	}
	await writeFile(path.join(root, 'README.md'), 'Changed guide\n');
	git('add', 'README.md');
	git('commit', '--quiet', '-m', 'prose');
	expect(await detect(git('rev-parse', 'HEAD'))).toBe('required=false\n');
	git('mv', 'vite.config.ts', 'AGENTS.md');
	git('commit', '--quiet', '-m', 'rename rendering input to prose');
	expect(await detect(git('rev-parse', 'HEAD'))).toBe('required=true\n');
	expect(await detect('f'.repeat(40))).toBe('required=true\n');
	expect(await detect(base)).toBe('required=true\n');
	await writeFile(eventPath, '{}');
	await writeFile(output, '');
	execFileSync(process.execPath, [script], {
		cwd: root,
		env: { ...process.env, GITHUB_EVENT_PATH: eventPath, GITHUB_OUTPUT: output },
		stdio: 'pipe',
	});
	expect(await readFile(output, 'utf8')).toBe('required=true\n');
});
