import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import * as z from 'zod';
import { createComponent } from './apply-component-creation-plan.js';

const roots: Array<string> = [];

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
				'export {',
				'\ttype StatusBadgeRecipeVariants,',
				'\tstatusBadgeRecipe,',
				"} from '../core/status-badge/recipe.css.js';",
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
				"import '../status-badge/recipe.css.js';",
				'',
			].join('\n'),
		);
		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/core/status-badge/status-badge.browser.test.tsx'),
				'utf8',
			),
		).resolves.toContain("import { StatusBadge } from '@luke-ui/react/status-badge';");
		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/core/status-badge/component-test-registration.ts'),
				'utf8',
			),
		).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('appends a generated recipe import after the existing imports', async () => {
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
				"import '../icon-button/recipe.css.js';",
				'',
			].join('\n'),
		);
	});

	it('preserves the registry dependency order and appends the new import last', async () => {
		const root = await createRepositoryFixture({
			modulesRegistry: [
				'// Style-producing modules in the shipped stylesheet.',
				"import '../text/recipe.css.js';",
				"import '../blockquote/recipe.css.js';",
				"import '../button/recipe.css.js';",
				'',
			].join('\n'),
		});

		await createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' });

		expect(await readFile(join(root, modulesRegistryPath), 'utf8')).toBe(
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../text/recipe.css.js';",
				"import '../blockquote/recipe.css.js';",
				"import '../button/recipe.css.js';",
				"import '../status-badge/recipe.css.js';",
				'',
			].join('\n'),
		);
	});

	it('scaffolds the full browser test coverage on disk', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			docsGroup: 'forms',
			name: 'DateField',
		});

		const browserTest = await readFile(
			join(root, 'packages/@luke-ui/react/src/core/date-field/date-field.browser.test.tsx'),
			'utf8',
		);
		expect(browserTest).toContain("import { DateField } from '@luke-ui/react/date-field';");
		expect(browserTest).toContain('expectForwardsDomProps');
		expect(browserTest).toContain('function DateFieldScene()');
		expect(browserTest).toContain("test('the DateField scene has no axe violations'");
		expect(browserTest).toContain("{ tags: ['visual'] }");
		expect(browserTest).not.toContain('testConformance');
		expect(browserTest).not.toContain('testIntegration');
	});

	it('omits the tagged visual case when visual coverage does not apply', async () => {
		const root = await createRepositoryFixture();

		await createComponent(root, {
			docsGroup: 'forms',
			name: 'DateField',
			visualCoverage: false,
		});

		const browserTest = await readFile(
			join(root, 'packages/@luke-ui/react/src/core/date-field/date-field.browser.test.tsx'),
			'utf8',
		);
		expect(browserTest).not.toContain("tags: ['visual']");
		expect(browserTest).not.toContain('captureVisualAppearance');
		expect(browserTest).toContain("test('the DateField scene has no axe violations'");
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

async function createRepositoryFixture(options?: { modulesRegistry?: string }): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
	roots.push(root);

	await mkdir(join(root, 'apps/docs/content/docs/components'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/styles'), { recursive: true });

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

	return root;
}

async function readJson(root: string, path: string): Promise<unknown> {
	return z.unknown().parse(JSON.parse(await readFile(join(root, path), 'utf8')));
}
