import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import * as z from 'zod';
import { createComponent } from './apply-component-creation-plan.js';

const roots: Array<string> = [];
const MANIFEST_MARKER =
	'].map(([name, path, conformanceTier, integrationTripwire, visualApplicability]) => ({';

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
			readFile(join(root, 'packages/@luke-ui/react/src/status-badge/index.ts'), 'utf8'),
		).resolves.toBe(
			[
				"export { StatusBadge, type StatusBadgeProps } from './status-badge.js';",
				"export { statusBadgeRecipe, type StatusBadgeRecipeVariants } from './recipe.css.js';",
				'',
			].join('\n'),
		);
		await expect(
			readFile(join(root, 'packages/@luke-ui/react/src/status-badge/status-badge.tsx'), 'utf8'),
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
				"import '../status-badge/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
		expect(await readFile(join(root, manifestPath), 'utf8')).toBe(
			[
				'const entries = [',
				"\t['Button', 'button', 'universal', 'required', 'applicable'],",
				"\t['StatusBadge', 'status-badge', 'universal', 'none', 'applicable'],",
				MANIFEST_MARKER,
				'\tname,',
				'}));',
				'',
			].join('\n'),
		);
		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/status-badge/component-test-registration.ts'),
				'utf8',
			),
		).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('inserts a generated recipe import in code-point order', async () => {
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
				"import '../icon-button/recipe.css.js';",
				"import '../icon/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
	});

	it('scaffolds field-shaped conformance on disk', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			conformanceTier: 'field-shaped',
			docsGroup: 'forms',
			name: 'DateField',
		});

		const browserTest = await readFile(
			join(root, 'packages/@luke-ui/react/src/date-field/date-field.browser.test.tsx'),
			'utf8',
		);
		expect(browserTest).toContain('testFieldShapedConformance');
		expect(browserTest).toContain("path: 'date-field'");
		expect(browserTest).not.toContain('getTarget');
		expect(browserTest).not.toContain("name: 'DateField'");
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['DateField', 'date-field', 'field-shaped', 'none', 'applicable']",
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
				join(root, 'packages/@luke-ui/react/src/action-chip/action-chip.browser.test.tsx'),
				'utf8',
			),
		).toContain("testIntegration('action-chip', async");
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['ActionChip', 'action-chip', 'universal', 'required', 'applicable']",
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
				join(root, 'packages/@luke-ui/react/src/date-field/date-field.visual.test.tsx'),
				'utf8',
			),
		).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['DateField', 'date-field', 'universal', 'none', 'none']",
		);
	});

	it('rejects docs navigation JSON that is not an object', async () => {
		const root = await createRepositoryFixture();
		await writeFile(join(root, 'apps/docs/content/docs/components/meta.json'), '[]\n', 'utf8');

		await expect(
			createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' }),
		).rejects.toBeInstanceOf(z.ZodError);
	});
});

const modulesRegistryPath = 'packages/@luke-ui/react/src/styles/modules.css.ts';
const manifestPath = 'packages/@luke-ui/react/src/conformance/manifest.ts';

async function createRepositoryFixture(options?: { modulesRegistry?: string }): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
	roots.push(root);

	await mkdir(join(root, 'apps/docs/content/docs/components'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/styles'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/conformance'), { recursive: true });

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
			"\t['Button', 'button', 'universal', 'required', 'applicable'],",
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
