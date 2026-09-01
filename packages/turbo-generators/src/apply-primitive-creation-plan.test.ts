import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import * as z from 'zod';
import { createComponent } from './apply-component-creation-plan.js';
import { createPrimitive } from './apply-primitive-creation-plan.js';

const roots: Array<string> = [];
const MANIFEST_MARKER =
	'].map(([name, path, conformance, integrationTripwire, visualApplicability]) => ({';

afterEach(async () => {
	await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })));
	roots.length = 0;
});

describe('createPrimitive', () => {
	it('applies parsed answers to a repository fixture and is safe to rerun', async () => {
		const root = await createRepositoryFixture();
		const answers = { name: 'StatusBadge' };

		await createPrimitive(root, answers);
		await createPrimitive(root, answers);

		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/exports/primitives/status-badge.ts'),
				'utf8',
			),
		).resolves.toBe(
			[
				'export {',
				'\tStatusBadge,',
				'\ttype StatusBadgeProps,',
				"} from '../../core/primitives/status-badge/status-badge.js';",
				'export {',
				'\ttype StatusBadgeRecipeVariants,',
				'\tstatusBadgeRecipe,',
				"} from '../../core/primitives/status-badge/recipe.css.js';",
				'',
			].join('\n'),
		);
		await expect(
			readFile(
				join(root, 'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.tsx'),
				'utf8',
			),
		).resolves.toContain('export function StatusBadge');
		expect(await readFile(join(root, modulesRegistryPath), 'utf8')).toBe(
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../button/recipe.css.js';",
				"import '../primitives/status-badge/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
		expect(await readFile(join(root, manifestPath), 'utf8')).toBe(
			[
				'const entries = [',
				"\t['Button', 'button', ['dom'], 'required', 'applicable'],",
				"\t['Status Badge primitive', 'primitives/status-badge', [], 'none', 'none'],",
				MANIFEST_MARKER,
				'\tname,',
				'}));',
				'',
			].join('\n'),
		);
		await expect(
			readJson(root, 'apps/docs/content/docs/components/primitives/meta.json'),
		).resolves.toEqual({
			pages: ['status-badge'],
			title: 'Primitives',
		});
		await expect(
			readFile(join(root, 'apps/docs/src/examples/status-badge-primitive/basic.tsx'), 'utf8'),
		).resolves.toContain("from '@luke-ui/react/primitives/status-badge'");
		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/status-badge.mdx'), 'utf8'),
		).resolves.toContain('src="status-badge-primitive/basic"');
	});

	it('inserts a generated recipe import in code-point order', async () => {
		const root = await createRepositoryFixture({
			modulesRegistry: [
				'// Style-producing modules in the shipped stylesheet.',
				"import '../button/recipe.css.js';",
				"import '../primitives/field/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		});

		await createPrimitive(root, { name: 'InputAddon' });
		await createPrimitive(root, { name: 'InputAddon' });

		expect(await readFile(join(root, modulesRegistryPath), 'utf8')).toBe(
			[
				'// Style-producing modules in the shipped stylesheet.',
				"import '../button/recipe.css.js';",
				"import '../primitives/field/recipe.css.js';",
				"import '../primitives/input-addon/recipe.css.js';",
				"import '../text/recipe.css.js';",
				'',
			].join('\n'),
		);
	});

	it('scaffolds empty conformance on disk by default', async () => {
		const root = await createRepositoryFixture();

		await createPrimitive(root, {
			name: 'FieldRoot',
		});

		const browserTest = await readFile(
			join(
				root,
				'packages/@luke-ui/react/src/core/primitives/field-root/field-root.browser.test.tsx',
			),
			'utf8',
		);
		expect(browserTest).toContain("test('FieldRoot renders its root element'");
		expect(browserTest).not.toContain('testConformance');
		expect(await readFile(join(root, manifestPath), 'utf8')).toContain(
			"['Field Root primitive', 'primitives/field-root', [], 'none', 'none']",
		);
	});

	it('omits hosted docs when docs are disabled', async () => {
		const root = await createRepositoryFixture({
			primitivesMeta: {
				pages: ['button'],
				title: 'Primitives',
			},
		});

		await createPrimitive(root, { docs: false, name: 'StatusBadge' });

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/status-badge.mdx'), 'utf8'),
		).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(
			readJson(root, 'apps/docs/content/docs/components/primitives/meta.json'),
		).resolves.toEqual({
			pages: ['button'],
			title: 'Primitives',
		});
	});

	it('writes docs navigation JSON that is already formatter-clean', async () => {
		const root = await createRepositoryFixture({
			primitivesMeta: {
				pages: ['button'],
				title: 'Primitives',
			},
		});

		await createPrimitive(root, { name: 'StatusBadge' });

		await expect(
			readFile(join(root, 'apps/docs/content/docs/components/primitives/meta.json'), 'utf8'),
		).resolves.toBe('{\n\t"pages": ["button", "status-badge"],\n\t"title": "Primitives"\n}\n');
	});
});

describe('shared creation-plan application', () => {
	it('applies component and primitive plans through the same machinery', async () => {
		const root = await createRepositoryFixture({
			primitivesMeta: {
				pages: [],
				title: 'Primitives',
			},
		});
		await mkdir(join(root, 'apps/docs/content/docs/components/feedback'), { recursive: true });
		await writeFile(
			join(root, 'apps/docs/content/docs/components/meta.json'),
			`${JSON.stringify({ pages: ['actions'], title: 'Components' }, null, '\t')}\n`,
			'utf8',
		);

		await createComponent(root, { docsGroup: 'feedback', name: 'StatusBadge' });
		await createPrimitive(root, { name: 'InputAddon' });

		await expect(
			readFile(join(root, 'packages/@luke-ui/react/src/exports/status-badge.ts'), 'utf8'),
		).resolves.toContain('StatusBadge');
		await expect(
			readFile(join(root, 'packages/@luke-ui/react/src/exports/primitives/input-addon.ts'), 'utf8'),
		).resolves.toContain('export {');
	});
});

const modulesRegistryPath = 'packages/@luke-ui/react/src/core/styles/modules.css.ts';
const manifestPath = 'packages/@luke-ui/react/src/core/conformance/manifest.ts';

async function createRepositoryFixture(options?: {
	modulesRegistry?: string;
	primitivesMeta?: { pages: Array<string>; title: string };
}): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'primitive-plan-'));
	roots.push(root);

	await mkdir(join(root, 'apps/docs/content/docs/components/primitives'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/styles'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/conformance'), { recursive: true });

	await writeFile(
		join(root, 'apps/docs/content/docs/components/primitives/meta.json'),
		`${JSON.stringify(options?.primitivesMeta ?? { pages: [], title: 'Primitives' }, null, '\t')}\n`,
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
