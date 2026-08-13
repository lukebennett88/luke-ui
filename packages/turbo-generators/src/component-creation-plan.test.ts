import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import {
	parseComponentFrontmatter,
	renderPropsPage,
} from '../../../apps/docs/scripts/generate-props-pages.js';
import { createComponentPlan } from './component-creation-plan.js';

const roots: Array<string> = [];

afterEach(async () => {
	await Promise.all(roots.map((root) => rm(root, { force: true, recursive: true })));
	roots.length = 0;
});
const require = createRequire(import.meta.url);
const tscPath = join(dirname(require.resolve('typescript/package.json')), 'bin/tsc');

describe('createComponentPlan', () => {
	it('plans a component with a colocated recipe across package and hosted docs surfaces', () => {
		const plan = createComponentPlan({
			docsGroup: 'feedback',
			name: 'StatusBadge',
		});

		expect(plan.expected).toEqual({
			exampleSlug: 'status-badge/basic',
			hostedDocsPath: 'components/feedback/status-badge',
			packageDocsSlug: 'status-badge',
			packageExportPath: './status-badge',
		});
		expect(plan.files.map((file) => file.path).sort()).toEqual([
			'apps/docs/content/docs/components/feedback/status-badge.mdx',
			'apps/docs/src/examples/status-badge/basic.tsx',
			'packages/@luke-ui/react/src/status-badge/component-test-registration.ts',
			'packages/@luke-ui/react/src/status-badge/index.tsx',
			'packages/@luke-ui/react/src/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.visual.test.tsx',
		]);
		expect(plan.sortedImportEdits).toEqual([
			{
				kind: 'sorted-import',
				line: "import '../status-badge/recipe.css.js';",
				path: 'packages/@luke-ui/react/src/styles/modules.css.ts',
			},
		]);
		expect(plan.textFileAppends).toEqual([]);
		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['StatusBadge', 'status-badge', 'universal', 'none', 'applicable'],",
		]);

		const indexSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/index.tsx'),
		)?.contents;
		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.css.ts'),
		)?.contents;

		expect(indexSource).toContain('export { statusBadgeRecipe, type StatusBadgeRecipeVariants }');
		expect(recipeSource).toContain('export const statusBadgeRecipe = recipe({');
		expect(recipeSource).toContain(
			'export type StatusBadgeRecipeVariants = RecipeSelection<typeof statusBadgeRecipe>;',
		);
	});

	it('scaffolds field-shaped conformance registrations', () => {
		const plan = createComponentPlan({
			conformanceTier: 'field-shaped',
			docsGroup: 'forms',
			name: 'DateField',
		});

		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['DateField', 'date-field', 'field-shaped', 'none', 'applicable'],",
		]);
		expect(
			plan.files.find((file) => file.path.endsWith('/date-field.browser.test.tsx'))?.contents,
		).toContain('testFieldShapedConformance');
	});

	it('scaffolds integration tripwire coverage when requested', () => {
		const plan = createComponentPlan({
			docsGroup: 'actions',
			integrationTripwire: true,
			name: 'ActionChip',
		});

		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['ActionChip', 'action-chip', 'universal', 'required', 'applicable'],",
		]);
		expect(
			plan.files.find((file) => file.path.endsWith('/action-chip.browser.test.tsx'))?.contents,
		).toContain('testIntegration');
	});

	it('omits visual coverage when it does not apply', () => {
		const plan = createComponentPlan({
			docsGroup: 'forms',
			name: 'DateField',
			visualCoverage: false,
		});

		expect(plan.files.map((file) => file.path)).not.toContain(
			'packages/@luke-ui/react/src/date-field/date-field.visual.test.tsx',
		);
		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['DateField', 'date-field', 'universal', 'none', 'none'],",
		]);
	});

	it('rejects invalid component names before file writes', () => {
		expect(() => {
			return createComponentPlan({
				docsGroup: 'forms',
				name: '../Bad',
			});
		}).toThrow('Use letters/numbers/hyphens. Start with a letter.');
	});

	it('scaffolds a <group>/<name>.mdx guide that generate:props can turn into a props.mdx', () => {
		const plan = createComponentPlan({
			docsGroup: 'feedback',
			name: 'StatusBadge',
		});

		const guide = plan.files.find((file) => {
			return file.path.endsWith('feedback/status-badge.mdx');
		})?.contents;
		if (guide === undefined) throw new Error('Expected the scaffold to write the guide.');

		const frontmatter = parseComponentFrontmatter(guide);
		expect(frontmatter.props).toEqual([
			{
				heading: undefined,
				name: 'StatusBadgeProps',
				path: 'packages/@luke-ui/react/src/status-badge/index.tsx',
			},
		]);
		expect(renderPropsPage(frontmatter)).toContain(
			'<auto-type-table\n\tpath="packages/@luke-ui/react/src/status-badge/index.tsx"\n\tname="StatusBadgeProps"\n/>',
		);
	});

	it('type-checks the generated recipe contract', async () => {
		const root = await mkdtemp(join(tmpdir(), 'component-plan-typecheck-'));
		roots.push(root);

		const plan = createComponentPlan({
			docsGroup: 'feedback',
			name: 'StatusBadge',
		});

		const componentDir = join(root, 'packages/@luke-ui/react/src/status-badge');
		const stylesDir = join(root, 'packages/@luke-ui/react/src/styles');
		await mkdir(componentDir, { recursive: true });
		await mkdir(stylesDir, { recursive: true });

		const indexSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/index.tsx'),
		)?.contents;
		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.css.ts'),
		)?.contents;
		if (recipeSource === undefined) {
			throw new Error('Expected generated recipe source.');
		}

		expect(indexSource).toContain('export { statusBadgeRecipe, type StatusBadgeRecipeVariants }');

		await writeFile(join(componentDir, 'recipe.css.ts'), recipeSource, 'utf8');
		await writeFile(
			join(stylesDir, 'recipe.ts'),
			[
				'export function recipe(config: { base?: Record<string, string> }) {',
				'\treturn (selection?: Record<string, string>) => {',
				'\t\tvoid selection;',
				'\t\treturn "recipe-class";',
				'\t};',
				'}',
				'export type RecipeSelection<Fn> = Fn extends (selection?: infer Selection) => unknown',
				'\t? Selection',
				'\t: never;',
			].join('\n'),
			'utf8',
		);
		await writeFile(
			join(root, 'tsconfig.json'),
			JSON.stringify(
				{
					compilerOptions: {
						jsx: 'react-jsx',
						module: 'NodeNext',
						moduleResolution: 'NodeNext',
						noEmit: true,
						strict: true,
						target: 'ES2022',
					},
					include: ['packages/@luke-ui/react/src/status-badge/recipe.css.ts'],
				},
				null,
				'\t',
			),
			'utf8',
		);

		expect(() => {
			execFileSync(tscPath, ['--noEmit', '-p', join(root, 'tsconfig.json')], {
				encoding: 'utf8',
				stdio: 'pipe',
			});
		}).not.toThrow();
	});
});
