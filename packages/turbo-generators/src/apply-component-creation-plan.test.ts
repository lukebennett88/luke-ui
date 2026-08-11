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

	it('appends lines to a text file', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const barrelPath = 'packages/@luke-ui/react/src/recipes/index.ts';
		const initialContent = [
			"import '../stylesheet.css.js';",
			'',
			"export type { ButtonVariants } from '../recipes/button.css.js';",
			"export { button } from '../recipes/button.css.js';",
			"export { visuallyHidden } from '../recipes/visually-hidden.css.js';",
		].join('\n');

		await mkdir(join(root, 'packages/@luke-ui/react/src/recipes'), { recursive: true });
		await writeFile(join(root, barrelPath), initialContent, 'utf8');

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
					lines: [
						"export type { StatusBadgeVariants } from '../recipes/status-badge.css.js';",
						"export { statusBadge } from '../recipes/status-badge.css.js';",
					],
					path: barrelPath,
				},
			],
		};

		await applyComponentCreationPlan(root, plan);

		const result = await readFile(join(root, barrelPath), 'utf8');
		expect(result).toBe(
			[
				"import '../stylesheet.css.js';",
				'',
				"export type { ButtonVariants } from '../recipes/button.css.js';",
				"export { button } from '../recipes/button.css.js';",
				"export { visuallyHidden } from '../recipes/visually-hidden.css.js';",
				"export type { StatusBadgeVariants } from '../recipes/status-badge.css.js';",
				"export { statusBadge } from '../recipes/status-badge.css.js';",
				'',
			].join('\n'),
		);
	});

	it('inserts manifest entries idempotently', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const manifestPath = 'packages/@luke-ui/react/src/conformance/manifest.ts';
		const marker =
			'].map(([name, path, tier, conformanceTier, integrationTripwire, visualApplicability]) => ({';
		const initialContent = `const entries = [\n\t['Button', 'button', 'composed', 'universal', 'required', 'applicable'],\n${marker}\n\tname,\n}));\n`;
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
					lines: ["\t['StatusBadge', 'status-badge', 'atom', 'universal', 'none', 'applicable'],"],
					marker,
					path: manifestPath,
				},
			],
		};

		await applyComponentCreationPlan(root, plan);
		await applyComponentCreationPlan(root, plan);

		expect(await readFile(join(root, manifestPath), 'utf8')).toBe(
			`const entries = [\n\t['Button', 'button', 'composed', 'universal', 'required', 'applicable'],\n\t['StatusBadge', 'status-badge', 'atom', 'universal', 'none', 'applicable'],\n${marker}\n\tname,\n}));\n`,
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
