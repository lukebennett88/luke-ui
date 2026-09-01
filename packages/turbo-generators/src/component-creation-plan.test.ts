import { describe, expect, it } from 'vite-plus/test';
import { ZodError } from 'zod';
import { findComponentPropsTableTags } from '../../../apps/docs/src/lib/component-props-table-tags.js';
import {
	COMPONENT_DEFAULTS,
	createComponentPlan,
	parseComponentAnswers,
} from './component-creation-plan.js';
import { findUnresolvedImports } from './test-utils/find-unresolved-imports.js';

const validAnswers = {
	docsGroup: 'feedback',
	name: 'StatusBadge',
} as const;

describe('parseComponentAnswers', () => {
	it('rejects invalid docs group answers', () => {
		expect(() => parseComponentAnswers({ ...validAnswers, docsGroup: 'primitives' })).toThrow(
			ZodError,
		);
	});

	it('accepts layout as a docs group', () => {
		expect(parseComponentAnswers({ ...validAnswers, docsGroup: 'layout' }).docsGroup).toBe(
			'layout',
		);
	});

	it('defaults test applicability for omitted answers', () => {
		expect(parseComponentAnswers(validAnswers)).toEqual({
			...COMPONENT_DEFAULTS,
			docsGroup: 'feedback',
			name: 'StatusBadge',
		});
	});
});

describe('createComponentPlan', () => {
	it('plans a component with a colocated recipe across package and hosted docs surfaces', () => {
		const plan = createComponentPlan(validAnswers);

		expect(plan.expected).toEqual({
			exampleSlug: 'status-badge/basic',
			hostedDocsPath: 'components/feedback/status-badge',
			packageDocsSlug: 'status-badge',
			packageExportPath: './status-badge',
		});
		expect(plan.files.map((file) => file.path).sort()).toEqual([
			'apps/docs/content/docs/components/feedback/status-badge.mdx',
			'apps/docs/src/examples/status-badge/basic.tsx',
			'packages/@luke-ui/react/src/core/status-badge/recipe.ts',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.visual.test.tsx',
			'packages/@luke-ui/react/src/exports/status-badge.ts',
		]);
		expect(plan.files.map((file) => file.path)).not.toContainEqual(
			expect.stringMatching(/core\/status-badge\/index\.ts$/),
		);
		expect(plan).not.toHaveProperty('jsonEdits');
		expect(plan).not.toHaveProperty('sortedImportEdits');
		expect(plan).not.toHaveProperty('textFileInserts');

		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.ts'),
		)?.contents;
		const componentSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.tsx'),
		)?.contents;
		const packageExportSource = plan.files.find((file) =>
			file.path.endsWith('/exports/status-badge.ts'),
		)?.contents;

		expect(componentSource).not.toContain('export { statusBadgeRecipe');
		expect(componentSource).toContain("import type { XStyleProps } from '../styles/xstyle.js';");
		expect(componentSource).toContain('resolveStatusBadgeRecipeStyles');
		expect(packageExportSource).toContain(
			"export { StatusBadge, type StatusBadgeProps } from '../core/status-badge/status-badge.js';",
		);
		expect(packageExportSource).toContain(
			"export { type StatusBadgeRecipeVariants, statusBadgeRecipe } from '../core/status-badge/recipe.js';",
		);
		expect(packageExportSource).not.toContain("from './index.js'");
		expect(recipeSource).toContain(
			'export const { recipe: statusBadgeRecipe, resolveStyles: resolveStatusBadgeRecipeStyles } =',
		);
		expect(recipeSource).toContain('createSingleRecipe({');
		expect(recipeSource).toContain(
			'export type StatusBadgeRecipeVariants = RecipeSelection<typeof statusBadgeRecipe>;',
		);

		for (const testPath of ['status-badge.browser.test.tsx', 'status-badge.visual.test.tsx']) {
			const testSource = plan.files.find((file) => file.path.endsWith(testPath))?.contents;
			if (testSource === undefined) throw new Error(`Expected the scaffold to write ${testPath}.`);
			expect(testSource).toContain("from './status-badge.js'");
			expect(testSource).not.toContain("from './index.js'");
		}
	});

	it('emits relative imports that resolve to real files already in the repo', async () => {
		const plan = createComponentPlan(validAnswers);

		const violations = (
			await Promise.all(plan.files.map((file) => findUnresolvedImports(file)))
		).flat();

		expect(violations).toEqual([]);
	});

	it('rejects invalid component names before file writes', () => {
		expect(() => {
			return createComponentPlan({
				docsGroup: 'forms',
				name: '../Bad',
			});
		}).toThrow('Use letters/numbers/hyphens. Start with a letter.');
	});

	it('scaffolds a <group>/<name>.mdx guide with a hand-authored API section', () => {
		const plan = createComponentPlan(validAnswers);

		const guide = plan.files.find((file) => {
			return file.path.endsWith('feedback/status-badge.mdx');
		})?.contents;
		if (guide === undefined) throw new Error('Expected the scaffold to write the guide.');

		expect(findComponentPropsTableTags(guide)).toEqual([
			{
				name: 'StatusBadgeProps',
				path: 'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx',
			},
		]);
	});
});
