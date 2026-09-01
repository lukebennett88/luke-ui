import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
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
				"\t['Status Badge primitive', 'primitives/status-badge', ['dom'], 'none', 'none'],",
				MANIFEST_MARKER,
				'\tname,',
				'}));',
				'',
			].join('\n'),
		);
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

	it('scaffolds empty conformance on disk', async () => {
		const root = await createRepositoryFixture();

		await createPrimitive(root, {
			conformance: [],
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
});

const modulesRegistryPath = 'packages/@luke-ui/react/src/core/styles/modules.css.ts';
const manifestPath = 'packages/@luke-ui/react/src/core/conformance/manifest.ts';

async function createRepositoryFixture(options?: { modulesRegistry?: string }): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'primitive-plan-'));
	roots.push(root);

	await mkdir(join(root, 'packages/@luke-ui/react/src/core/styles'), { recursive: true });
	await mkdir(join(root, 'packages/@luke-ui/react/src/core/conformance'), { recursive: true });

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
