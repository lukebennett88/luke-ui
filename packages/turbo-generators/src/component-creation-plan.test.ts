import { describe, expect, it } from 'vite-plus/test';
import {
	parseComponentFrontmatter,
	renderPropsPage,
} from '../../../apps/docs/scripts/generate-props-pages.js';
import { createComponentPlan } from './component-creation-plan.js';

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
			'packages/@luke-ui/react/src/status-badge/index.ts',
			'packages/@luke-ui/react/src/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.visual.test.tsx',
		]);
		expect(plan.sortedImportEdits).toEqual([
			{
				kind: 'sorted-import',
				line: "import '../status-badge/recipe.css.js';",
				path: 'packages/@luke-ui/react/src/styles/modules.css.ts',
			},
		]);
		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['StatusBadge', 'status-badge', 'universal', 'none', 'applicable'],",
		]);

		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.css.ts'),
		)?.contents;
		const indexSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.tsx'),
		)?.contents;
		const barrelSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/index.ts'),
		)?.contents;

		expect(indexSource).not.toContain('export { statusBadgeRecipe');
		expect(barrelSource).toContain(
			"export { StatusBadge, type StatusBadgeProps } from './status-badge.js';",
		);
		expect(barrelSource).toContain(
			"export { statusBadgeRecipe, type StatusBadgeRecipeVariants } from './recipe.css.js';",
		);
		expect(recipeSource).toContain('export const statusBadgeRecipe = recipe({');
		expect(recipeSource).toContain(
			'export type StatusBadgeRecipeVariants = RecipeSelection<typeof statusBadgeRecipe>;',
		);
	});

	it('scaffolds field-shaped conformance coverage without a universal target', () => {
		const plan = createComponentPlan({
			conformanceTier: 'field-shaped',
			docsGroup: 'forms',
			name: 'DateField',
		});

		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['DateField', 'date-field', 'field-shaped', 'none', 'applicable'],",
		]);
		const browserTest = plan.files.find((file) =>
			file.path.endsWith('/date-field.browser.test.tsx'),
		)?.contents;
		expect(browserTest).toContain('testFieldShapedConformance');
		expect(browserTest).toContain("path: 'date-field'");
		expect(browserTest).not.toContain('getTarget');
		expect(browserTest).not.toContain("name: 'DateField'");
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
		).toContain("testIntegration('action-chip', async");
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
				path: 'packages/@luke-ui/react/src/status-badge/status-badge.tsx',
			},
		]);
		expect(renderPropsPage(frontmatter)).toContain(
			'<auto-type-table\n\tpath="packages/@luke-ui/react/src/status-badge/status-badge.tsx"\n\tname="StatusBadgeProps"\n/>',
		);
	});
});
