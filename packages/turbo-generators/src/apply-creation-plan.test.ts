import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { applyCreationPlan } from './apply-creation-plan.js';

const roots: Array<string> = [];

afterEach(async () => {
	await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })));
	roots.length = 0;
});

describe('applyCreationPlan json edits', () => {
	it('appends a unique page without reordering existing entries', async () => {
		const root = await createMetaFixture({
			pages: ['button', 'checkbox', 'field', 'input-group', 'combobox'],
		});

		await applyCreationPlan(root, {
			files: [],
			jsonEdits: [
				{
					key: 'pages',
					kind: 'array-add-append-unique',
					path: 'apps/docs/content/docs/components/primitives/meta.json',
					title: 'Primitives',
					value: 'status-badge',
				},
			],
			sortedImportEdits: [],
			textFileInserts: [],
		});

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/meta.json'), 'utf8'),
		).resolves.toBe(
			'{\n\t"pages": ["button", "checkbox", "field", "input-group", "combobox", "status-badge"],\n\t"title": "Primitives"\n}\n',
		);
	});

	it('does not duplicate an existing append-unique page entry', async () => {
		const root = await createMetaFixture({
			pages: ['button', 'checkbox', 'field', 'input-group', 'combobox'],
		});
		const edit = {
			files: [],
			jsonEdits: [
				{
					key: 'pages' as const,
					kind: 'array-add-append-unique' as const,
					path: 'apps/docs/content/docs/components/primitives/meta.json',
					title: 'Primitives',
					value: 'field',
				},
			],
			sortedImportEdits: [],
			textFileInserts: [],
		};

		await applyCreationPlan(root, edit);
		await applyCreationPlan(root, edit);

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/meta.json'), 'utf8'),
		).resolves.toBe(
			'{\n\t"pages": ["button", "checkbox", "field", "input-group", "combobox"],\n\t"title": "Primitives"\n}\n',
		);
	});
});

async function createMetaFixture(input: { pages: Array<string> }): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'creation-plan-json-'));
	roots.push(root);
	await mkdir(join(root, 'apps/docs/content/docs/components/primitives'), { recursive: true });
	await writeFile(
		join(root, 'apps/docs/content/docs/components/primitives/meta.json'),
		`${JSON.stringify({ pages: input.pages, title: 'Primitives' }, null, '\t')}\n`,
		'utf8',
	);
	return root;
}
