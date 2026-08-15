import { describe, expect, it } from 'vite-plus/test';
import { ZodError } from 'zod';
import {
	parseComponentFrontmatter,
	renderPropsPage,
} from '../../../apps/docs/scripts/generate-props-pages.js';
import {
	COMPONENT_DEFAULTS,
	createComponentPlan,
	parseComponentAnswers,
} from './component-creation-plan.js';

const validAnswers = {
	docsGroup: 'feedback',
	name: 'StatusBadge',
} as const;

describe('parseComponentAnswers', () => {
	it('rejects invalid docs group answers', () => {
		expect(() => parseComponentAnswers({ ...validAnswers, docsGroup: 'layout' })).toThrow(ZodError);
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
			'packages/@luke-ui/react/src/status-badge/index.ts',
			'packages/@luke-ui/react/src/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.visual.test.tsx',
		]);
		expect(plan).not.toHaveProperty('jsonEdits');
		expect(plan).not.toHaveProperty('sortedImportEdits');
		expect(plan).not.toHaveProperty('textFileInserts');

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

	it('rejects invalid component names before file writes', () => {
		expect(() => {
			return createComponentPlan({
				docsGroup: 'forms',
				name: '../Bad',
			});
		}).toThrow('Use letters/numbers/hyphens. Start with a letter.');
	});

	it('scaffolds a <group>/<name>.mdx guide that generate:props can turn into a props.mdx', () => {
		const plan = createComponentPlan(validAnswers);

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
