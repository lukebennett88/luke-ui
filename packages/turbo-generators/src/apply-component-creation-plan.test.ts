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
			pages: ['---Actions---', 'actions/button', '---Feedback---', 'feedback/status-badge'],
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

	it('inserts group/name into the root sidebar without sorting section markers', async () => {
		const root = await createRepositoryFixture({
			rootPages: [
				'---Overview---',
				'index',
				'---Actions---',
				'actions/button',
				'---Forms---',
				'forms/checkbox-field',
				'forms/select-field',
				'---Primitives---',
				'primitives/button',
			],
		});

		await createComponent(root, { docsGroup: 'forms', name: 'form' });

		await expect(readJson(root, 'apps/docs/content/docs/components/meta.json')).resolves.toEqual({
			pages: [
				'---Overview---',
				'index',
				'---Actions---',
				'actions/button',
				'---Forms---',
				'forms/checkbox-field',
				'forms/form',
				'forms/select-field',
				'---Primitives---',
				'primitives/button',
			],
			title: 'Components',
		});
		await expect(
			readJson(root, 'apps/docs/content/docs/components/forms/meta.json'),
		).resolves.toEqual({
			pages: ['form'],
			title: 'Forms',
		});
	});

	it('places group/name after its section header when the group has no pages yet', async () => {
		const root = await createRepositoryFixture({
			rootPages: [
				'---Overview---',
				'index',
				'---Actions---',
				'actions/button',
				'---Feedback---',
				'---Primitives---',
				'primitives/button',
			],
		});

		await createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' });

		await expect(readJson(root, 'apps/docs/content/docs/components/meta.json')).resolves.toEqual({
			pages: [
				'---Overview---',
				'index',
				'---Actions---',
				'actions/button',
				'---Feedback---',
				'feedback/status-badge',
				'---Primitives---',
				'primitives/button',
			],
			title: 'Components',
		});
		await expect(
			readJson(root, 'apps/docs/content/docs/components/feedback/meta.json'),
		).resolves.toEqual({
			pages: ['status-badge'],
			title: 'Feedback',
		});
	});

	it('rejects a missing docs group section header instead of appending after another section', async () => {
		const root = await createRepositoryFixture({
			rootPages: [
				'---Overview---',
				'index',
				'---Actions---',
				'actions/button',
				'---Primitives---',
				'primitives/button',
			],
		});

		await expect(
			createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' }),
		).rejects.toThrow(
			'Cannot insert "feedback/status-badge": root components sidebar is missing section header "---Feedback---"',
		);
		await expect(readJson(root, 'apps/docs/content/docs/components/meta.json')).resolves.toEqual({
			pages: [
				'---Overview---',
				'index',
				'---Actions---',
				'actions/button',
				'---Primitives---',
				'primitives/button',
			],
			title: 'Components',
		});
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
		).resolves.toBe(
			'{\n\t"pages": ["---Actions---", "actions/button", "---Feedback---", "feedback/status-badge"],\n\t"title": "Components"\n}\n',
		);
	});

	it('formats scaffold output to the exported-prop, JSDoc, example, and Accessibility conventions', async () => {
		const root = await createRepositoryFixture({
			rootPages: [
				'---Actions---',
				'actions/button',
				'---Feedback---',
				'---Forms---',
				'---Layout---',
			],
		});

		await createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' });
		await createComponent(root, { docsGroup: 'layout', name: 'AuditProbe' });

		const componentSource = await readFile(
			join(root, 'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx'),
			'utf8',
		);
		expect(componentSource).toBe(
			[
				"import type { ComponentProps, JSX } from 'react';",
				"import { cx } from '../../shared/utils/utils.js';",
				"import type { Prettify } from '../types/prettify.js';",
				"import { statusBadgeRecipe } from './recipe.css.js';",
				'',
				"interface _StatusBadgeProps extends ComponentProps<'div'> {}",
				'',
				'/** Props for `StatusBadge`. */',
				'export type StatusBadgeProps = Prettify<_StatusBadgeProps>;',
				'',
				'/** Renders a `div` with the component recipe class. */',
				'export function StatusBadge(props: StatusBadgeProps): JSX.Element {',
				'\tconst { className, ...divProps } = props;',
				'\treturn <div {...divProps} className={cx(statusBadgeRecipe(), className)} />;',
				'}',
				'',
			].join('\n'),
		);

		await expect(
			readFile(join(root, 'apps/docs/src/examples/status-badge/basic.tsx'), 'utf8'),
		).resolves.toBe(
			[
				"import { StatusBadge } from '@luke-ui/react/status-badge';",
				'',
				'export default () => {',
				'\treturn <StatusBadge>StatusBadge</StatusBadge>;',
				'};',
				'',
			].join('\n'),
		);

		const feedbackGuide = await readFile(
			join(root, 'apps/docs/content/docs/components/feedback/status-badge.mdx'),
			'utf8',
		);
		expect(feedbackGuide).toContain('## Accessibility\n\n## API');
		expect(feedbackGuide).not.toMatch(/## Accessibility\n\n[^#]/);

		const layoutGuide = await readFile(
			join(root, 'apps/docs/content/docs/components/layout/audit-probe.mdx'),
			'utf8',
		);
		expect(layoutGuide).not.toContain('## Accessibility');
		expect(layoutGuide).toContain('## API');
	});
});

const modulesRegistryPath = 'packages/@luke-ui/react/src/core/styles/modules.css.ts';

const defaultRootPages = ['---Actions---', 'actions/button', '---Feedback---'] as const;

async function createRepositoryFixture(options?: {
	modulesRegistry?: string;
	rootPages?: Array<string>;
}): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'component-plan-'));
	roots.push(root);

	await mkdir(join(root, 'apps/docs/content/docs/components'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/styles'), { recursive: true });

	await writeFile(
		join(root, 'apps/docs/content/docs/components/meta.json'),
		`${JSON.stringify(
			{ pages: options?.rootPages ?? [...defaultRootPages], title: 'Components' },
			null,
			'\t',
		)}\n`,
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
