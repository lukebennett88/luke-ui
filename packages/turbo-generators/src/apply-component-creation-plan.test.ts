import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import * as z from 'zod';
import { applyComponentCreationPlan } from './apply-component-creation-plan.js';
import type { ComponentCreationPlan } from './component-creation-plan.js';

const roots: Array<string> = [];

afterEach(async () => {
	await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })));
	roots.length = 0;
});

describe('applyComponentCreationPlan', () => {
	it('writes files and applies sorted docs navigation edits idempotently', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const plan: ComponentCreationPlan = {
			expected: {
				exampleSlug: 'status-badge/basic',
				hostedDocsPath: 'components/feedback/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
			},
			files: [
				{
					contents: 'export const StatusBadge = 1;\n',
					path: 'packages/@luke-ui/react/src/status-badge/index.tsx',
				},
			],
			jsonEdits: [
				{
					key: 'pages',
					kind: 'array-add-sorted',
					path: 'apps/docs/content/docs/components/meta.json',
					title: 'Components',
					value: 'feedback',
				},
				{
					key: 'pages',
					kind: 'array-add-sorted',
					path: 'apps/docs/content/docs/components/feedback/meta.json',
					title: 'Feedback',
					value: 'status-badge',
				},
			],
			textFileAppends: [],
		};

		await applyComponentCreationPlan(root, plan);
		await applyComponentCreationPlan(root, plan);

		await expect(
			readFile(join(root, 'packages/@luke-ui/react/src/status-badge/index.tsx'), 'utf8'),
		).resolves.toBe('export const StatusBadge = 1;\n');
		await expect(readJson(root, 'apps/docs/content/docs/components/meta.json')).resolves.toEqual({
			pages: ['feedback'],
			title: 'Components',
		});
		await expect(
			readJson(root, 'apps/docs/content/docs/components/feedback/meta.json'),
		).resolves.toEqual({
			pages: ['status-badge'],
			title: 'Feedback',
		});
	});

	it('appends lines without reordering existing content', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const targetPath = 'packages/@luke-ui/react/src/styles/notes.txt';
		const initialContent = ['alpha', 'zeta'].join('\n');

		await mkdir(join(root, 'packages/@luke-ui/react/src/styles'), { recursive: true });
		await writeFile(join(root, targetPath), initialContent, 'utf8');

		const plan: ComponentCreationPlan = {
			expected: {
				exampleSlug: 'status-badge/basic',
				hostedDocsPath: 'components/actions/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
			},
			files: [],
			jsonEdits: [],
			textFileAppends: [
				{
					kind: 'text-append',
					lines: ['beta'],
					path: targetPath,
				},
			],
		};

		await applyComponentCreationPlan(root, plan);

		const result = await readFile(join(root, targetPath), 'utf8');
		expect(result).toBe(['alpha', 'zeta', 'beta', ''].join('\n'));
	});

	it('inserts a generated recipe import in alphabetical order', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const registryPath = 'packages/@luke-ui/react/src/styles/modules.css.ts';
		const initialContent = [
			'// Style-producing modules in the shipped stylesheet.',
			"import '../button/recipe.css.js';",
			"import '../text/recipe.css.js';",
			'',
		].join('\n');

		await mkdir(join(root, 'packages/@luke-ui/react/src/styles'), { recursive: true });
		await writeFile(join(root, registryPath), initialContent, 'utf8');

		const plan: ComponentCreationPlan = {
			expected: {
				exampleSlug: 'status-badge/basic',
				hostedDocsPath: 'components/actions/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
			},
			files: [],
			jsonEdits: [],
			sortedImportEdits: [
				{
					kind: 'sorted-import',
					line: "import '../status-badge/recipe.css.js';",
					path: registryPath,
				},
			],
			textFileAppends: [],
		};

		await applyComponentCreationPlan(root, plan);
		await applyComponentCreationPlan(root, plan);

		const result = await readFile(join(root, registryPath), 'utf8');
		expect(result).toBe(
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../button/recipe.css.js';",
				"import '../status-badge/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
	});

	it('inserts manifest entries idempotently', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const manifestPath = 'packages/@luke-ui/react/src/conformance/manifest.ts';
		const marker =
			'].map(([name, path, conformanceTier, integrationTripwire, visualApplicability]) => ({';
		const initialContent = `const entries = [\n\t['Button', 'button', 'universal', 'required', 'applicable'],\n${marker}\n\tname,\n}));\n`;
		await mkdir(join(root, 'packages/@luke-ui/react/src/conformance'), { recursive: true });
		await writeFile(join(root, manifestPath), initialContent, 'utf8');

		const plan: ComponentCreationPlan = {
			expected: {
				exampleSlug: 'status-badge/basic',
				hostedDocsPath: 'components/feedback/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
			},
			files: [],
			jsonEdits: [],
			textFileAppends: [],
			textFileInserts: [
				{
					kind: 'text-insert',
					lines: ["\t['StatusBadge', 'status-badge', 'universal', 'none', 'applicable'],"],
					marker,
					path: manifestPath,
				},
			],
		};

		await applyComponentCreationPlan(root, plan);
		await applyComponentCreationPlan(root, plan);

		expect(await readFile(join(root, manifestPath), 'utf8')).toBe(
			`const entries = [\n\t['Button', 'button', 'universal', 'required', 'applicable'],\n\t['StatusBadge', 'status-badge', 'universal', 'none', 'applicable'],\n${marker}\n\tname,\n}));\n`,
		);
	});

	it('rejects docs navigation JSON that is not an object', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const metaPath = 'apps/docs/content/docs/components/meta.json';
		await mkdir(join(root, 'apps/docs/content/docs/components'), { recursive: true });
		await writeFile(join(root, metaPath), '[]\n', 'utf8');

		const plan: ComponentCreationPlan = {
			expected: {
				exampleSlug: 'status-badge/basic',
				hostedDocsPath: 'components/feedback/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
			},
			files: [],
			jsonEdits: [
				{
					key: 'pages',
					kind: 'array-add-sorted',
					path: metaPath,
					title: 'Components',
					value: 'feedback',
				},
			],
			textFileAppends: [],
		};

		await expect(applyComponentCreationPlan(root, plan)).rejects.toBeInstanceOf(z.ZodError);
	});
});

async function readJson(root: string, path: string): Promise<unknown> {
	return z.unknown().parse(JSON.parse(await readFile(join(root, path), 'utf8')));
}
