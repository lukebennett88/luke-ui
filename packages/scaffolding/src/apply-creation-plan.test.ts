import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { applyCreationPlan } from './apply-creation-plan.js';

const roots: Array<string> = [];

afterEach(async () => {
	await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })));
	roots.length = 0;
});

describe('applyCreationPlan json edits', () => {
	it('inserts among same-prefix pages without sorting the rest of the list', async () => {
		const root = await createMetaFixture({
			pages: [
				'---Overview---',
				'index',
				'---Forms---',
				'forms/checkbox-field',
				'forms/select-field',
				'---Primitives---',
				'primitives/button',
			],
			path: 'apps/docs/content/docs/components/meta.json',
			title: 'Components',
		});

		await applyCreationPlan(root, {
			files: [],
			importEdits: [],
			jsonEdits: [
				{
					key: 'pages',
					kind: 'array-add-prefix-sorted',
					path: 'apps/docs/content/docs/components/meta.json',
					sectionHeader: '---Forms---',
					title: 'Components',
					value: 'forms/form',
				},
			],
			textFileInserts: [],
		});

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/meta.json'), 'utf8'),
		).resolves.toBe(
			[
				'{',
				'\t"pages": [',
				'\t\t"---Overview---",',
				'\t\t"index",',
				'\t\t"---Forms---",',
				'\t\t"forms/checkbox-field",',
				'\t\t"forms/form",',
				'\t\t"forms/select-field",',
				'\t\t"---Primitives---",',
				'\t\t"primitives/button"',
				'\t],',
				'\t"title": "Components"',
				'}',
				'',
			].join('\n'),
		);
	});

	it('inserts after the section header when no same-prefix peers exist', async () => {
		const root = await createMetaFixture({
			pages: [
				'---Actions---',
				'actions/button',
				'---Feedback---',
				'---Primitives---',
				'primitives/button',
			],
			path: 'apps/docs/content/docs/components/meta.json',
			title: 'Components',
		});

		await applyCreationPlan(root, {
			files: [],
			importEdits: [],
			jsonEdits: [
				{
					key: 'pages',
					kind: 'array-add-prefix-sorted',
					path: 'apps/docs/content/docs/components/meta.json',
					sectionHeader: '---Feedback---',
					title: 'Components',
					value: 'feedback/status-badge',
				},
			],
			textFileInserts: [],
		});

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/meta.json'), 'utf8'),
		).resolves.toBe(
			[
				'{',
				'\t"pages": [',
				'\t\t"---Actions---",',
				'\t\t"actions/button",',
				'\t\t"---Feedback---",',
				'\t\t"feedback/status-badge",',
				'\t\t"---Primitives---",',
				'\t\t"primitives/button"',
				'\t],',
				'\t"title": "Components"',
				'}',
				'',
			].join('\n'),
		);
	});

	it('rejects a missing section header instead of appending under another section', async () => {
		const root = await createMetaFixture({
			pages: ['---Actions---', 'actions/button', '---Primitives---', 'primitives/button'],
			path: 'apps/docs/content/docs/components/meta.json',
			title: 'Components',
		});
		const before = await readFile(
			join(root, 'apps/docs/content/docs/components/meta.json'),
			'utf8',
		);

		await expect(
			applyCreationPlan(root, {
				files: [],
				importEdits: [],
				jsonEdits: [
					{
						key: 'pages',
						kind: 'array-add-prefix-sorted',
						path: 'apps/docs/content/docs/components/meta.json',
						sectionHeader: '---Feedback---',
						title: 'Components',
						value: 'feedback/status-badge',
					},
				],
				textFileInserts: [],
			}),
		).rejects.toThrow(
			'Cannot insert "feedback/status-badge": root components sidebar is missing section header "---Feedback---"',
		);
		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/meta.json'), 'utf8'),
		).resolves.toBe(before);
	});

	it('appends a unique page without reordering existing entries', async () => {
		const root = await createMetaFixture({
			pages: ['button', 'checkbox', 'field', 'text-input', 'combobox'],
		});

		await applyCreationPlan(root, {
			files: [],
			importEdits: [],
			jsonEdits: [
				{
					key: 'pages',
					kind: 'array-add-append-unique',
					path: 'apps/docs/content/docs/components/primitives/meta.json',
					title: 'Primitives',
					value: 'status-badge',
				},
			],
			textFileInserts: [],
		});

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/meta.json'), 'utf8'),
		).resolves.toBe(
			'{\n\t"pages": ["button", "checkbox", "field", "text-input", "combobox", "status-badge"],\n\t"title": "Primitives"\n}\n',
		);
	});

	it('does not duplicate an existing append-unique page entry', async () => {
		const root = await createMetaFixture({
			pages: ['button', 'checkbox', 'field', 'text-input', 'combobox'],
		});
		const edit = {
			files: [],
			importEdits: [],
			jsonEdits: [
				{
					key: 'pages' as const,
					kind: 'array-add-append-unique' as const,
					path: 'apps/docs/content/docs/components/primitives/meta.json',
					title: 'Primitives',
					value: 'field',
				},
			],
			textFileInserts: [],
		};

		await applyCreationPlan(root, edit);
		await applyCreationPlan(root, edit);

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/meta.json'), 'utf8'),
		).resolves.toBe(
			'{\n\t"pages": ["button", "checkbox", "field", "text-input", "combobox"],\n\t"title": "Primitives"\n}\n',
		);
	});
});

async function createMetaFixture(input: {
	pages: Array<string>;
	path?: string;
	title?: string;
}): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'creation-plan-json-'));
	roots.push(root);
	const path = input.path ?? 'apps/docs/content/docs/components/primitives/meta.json';
	const target = join(root, path);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(
		target,
		`${JSON.stringify({ pages: input.pages, title: input.title ?? 'Primitives' }, null, '\t')}\n`,
		'utf8',
	);
	return root;
}
