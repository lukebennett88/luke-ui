import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';
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
				hostedDocsPath: 'components/feedback/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
				storySlug: 'status-badge',
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

	it('rejects docs navigation JSON that is not an object', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
		roots.push(root);

		const metaPath = 'apps/docs/content/docs/components/meta.json';
		await mkdir(join(root, 'apps/docs/content/docs/components'), { recursive: true });
		await writeFile(join(root, metaPath), '[]\n', 'utf8');

		const plan: ComponentCreationPlan = {
			expected: {
				hostedDocsPath: 'components/feedback/status-badge',
				packageDocsSlug: 'status-badge',
				packageExportPath: './status-badge',
				storySlug: 'status-badge',
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
		};

		await expect(applyComponentCreationPlan(root, plan)).rejects.toBeInstanceOf(z.ZodError);
	});
});

async function readJson(root: string, path: string): Promise<unknown> {
	return z.unknown().parse(JSON.parse(await readFile(join(root, path), 'utf8')));
}
