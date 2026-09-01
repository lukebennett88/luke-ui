import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import * as z from 'zod';
import { createComponent } from './apply-component-creation-plan.js';

const roots: Array<string> = [];
const MANIFEST_MARKER =
	'].map(([name, path, conformance, integrationTripwire, visualApplicability]) => ({';

afterEach(async () => {
	await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })));
	roots.length = 0;
});

describe('createComponent', () => {
	it('applies parsed answers to a repository fixture and is safe to rerun', async () => {
		const root = await createRepositoryFixture();
		const answers = { docsGroup: 'feedback', name: 'StatusBadge' };

		await createComponent(root, answers);
		await createComponent(root, answers);

		await expect(
			readFile(join(root, 'packages/@luke-ui/react/src/exports/status-badge.ts'), 'utf8'),
		).resolves.toBe(
			[
				"export { StatusBadge, type StatusBadgeProps } from '../core/status-badge/status-badge.js';",
				"export { type StatusBadgeRecipeVariants, statusBadgeRecipe } from '../core/status-badge/recipe.js';",
				'',
			].join('\n'),
		);
		await expect(
			readFile(join(root, 'packages/@luke-ui/react/src/core/status-badge/index.ts'), 'utf8'),
		).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx'),
				'utf8',
			),
		).resolves.toContain('export function StatusBadge');
		await expect(readJson(root, 'apps/docs/content/docs/components/meta.json')).resolves.toEqual({
			pages: ['actions', 'feedback'],
			title: 'Components',
		});
		await expect(
			readJson(root, 'apps/docs/content/docs/components/feedback/meta.json'),
		).resolves.toEqual({
			pages: ['status-badge'],
			title: 'Feedback',
		});
		expect(await readFile(join(root, modulesRegistryPath), 'utf8')).toBe(
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../button/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
		expect(await readFile(join(root, manifestPath), 'utf8')).toBe(
			[
				'const entries = [',
				"\t['Button', 'button', ['dom'], 'required', 'applicable'],",
				"\t['StatusBadge', 'status-badge', ['dom'], 'none', 'applicable'],",
				MANIFEST_MARKER,
				'\tname,',
				'}));',
				'',
			].join('\n'),
		);
		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/core/status-badge/component-test-registration.ts'),
				'utf8',
			),
		).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('leaves the Vanilla Extract stylesheet registry untouched', async () => {
		const root = await createRepositoryFixture({
			modulesRegistry: [
				'// Style-producing modules in the shipped stylesheet.',
				"import '../Icon/recipe.css.js';",
				"import '../button/recipe.css.js';",
				"import '../icon/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		});

		await createComponent(root, { docsGroup: 'actions', name: 'IconButton' });
		await createComponent(root, { docsGroup: 'actions', name: 'IconButton' });

		expect(await readFile(join(root, modulesRegistryPath), 'utf8')).toBe(
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../Icon/recipe.css.js';",
				"import '../button/recipe.css.js';",
				"import '../icon/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
	});

	it('scaffolds field conformance on disk', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			conformance: ['field'],
			docsGroup: 'forms',
			name: 'DateField',
		});

		const browserTest = await readFile(
			join(root, 'packages/@luke-ui/react/src/core/date-field/date-field.browser.test.tsx'),
			'utf8',
		);
		expect(browserTest).toContain('testConformance');
		expect(browserTest).toContain("path: 'date-field'");
		expect(browserTest).toContain('getControl');
		expect(browserTest).not.toContain('getTarget');
		expect(browserTest).not.toContain("name: 'DateField'");
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['DateField', 'date-field', ['field'], 'none', 'applicable']",
		);
	});

	it('scaffolds stacked DOM and field conformance on disk', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			conformance: ['field', 'dom'],
			docsGroup: 'forms',
			name: 'DateField',
		});

		const browserTest = await readFile(
			join(root, 'packages/@luke-ui/react/src/core/date-field/date-field.browser.test.tsx'),
			'utf8',
		);
		expect(browserTest).toContain('testConformance');
		expect(browserTest).toContain('getControl');
		expect(browserTest).toContain('getTarget');
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['DateField', 'date-field', ['dom', 'field'], 'none', 'applicable']",
		);
	});

	it('scaffolds an empty conformance list on disk', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			conformance: [],
			docsGroup: 'typography',
			name: 'Mark',
		});

		const browserTest = await readFile(
			join(root, 'packages/@luke-ui/react/src/core/mark/mark.browser.test.tsx'),
			'utf8',
		);
		expect(browserTest).toContain("test('Mark renders its root element'");
		expect(browserTest).not.toContain('testConformance');
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['Mark', 'mark', [], 'none', 'applicable']",
		);
	});

	it('scaffolds integration tripwire coverage when requested', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			docsGroup: 'actions',
			integrationTripwire: true,
			name: 'ActionChip',
		});

		expect(
			await readFile(
				join(root, 'packages/@luke-ui/react/src/core/action-chip/action-chip.browser.test.tsx'),
				'utf8',
			),
		).toContain("testIntegration('action-chip', async");
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['ActionChip', 'action-chip', ['dom'], 'required', 'applicable']",
		);
	});

	it('omits visual coverage when it does not apply', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			docsGroup: 'forms',
			name: 'DateField',
			visualCoverage: false,
		});

		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/core/date-field/date-field.visual.test.tsx'),
				'utf8',
			),
		).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['DateField', 'date-field', ['dom'], 'none', 'none']",
		);
	});

	it('rejects docs navigation JSON that is not an object', async () => {
		const root = await createRepositoryFixture();
		await writeFile(join(root, 'apps/docs/content/docs/components/meta.json'), '[]\n', 'utf8');

		await expect(
			createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' }),
		).rejects.toBeInstanceOf(z.ZodError);
	});

	it('writes docs navigation JSON that is already formatter-clean', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' });

		// oxfmt collapses short pages arrays onto one line; raw JSON.stringify leaves them
		// multi-line and fails check:format.
		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/feedback/meta.json'), 'utf8'),
		).resolves.toBe('{\n\t"pages": ["status-badge"],\n\t"title": "Feedback"\n}\n');
		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/meta.json'), 'utf8'),
		).resolves.toBe('{\n\t"pages": ["actions", "feedback"],\n\t"title": "Components"\n}\n');
	});
});

const modulesRegistryPath = 'packages/@luke-ui/react/src/core/styles/modules.css.ts';
const manifestPath = 'packages/@luke-ui/react/src/core/conformance/manifest.ts';

async function createRepositoryFixture(options?: { modulesRegistry?: string }): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
	roots.push(root);

	await mkdir(join(root, 'apps/docs/content/docs/components'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/styles'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/conformance'), { recursive: true });

	await writeFile(
		join(root, 'apps/docs/content/docs/components/meta.json'),
		`${JSON.stringify({ pages: ['actions'], title: 'Components' }, null, '\t')}\n`,
		'utf8',
	);
	await writeFile(
		join(root, modulesRegistryPath),
		options?.modulesRegistry ??
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../button/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		'utf8',
	);
	await writeFile(
		join(root, manifestPath),
		[
			'const entries = [',
			"\t['Button', 'button', ['dom'], 'required', 'applicable'],",
			MANIFEST_MARKER,
			'\tname,',
			'}));',
			'',
		].join('\n'),
		'utf8',
	);

	return root;
}

async function readJson(root: string, path: string): Promise<unknown> {
	return z.unknown().parse(JSON.parse(await readFile(join(root, path), 'utf8')));
}
