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
			'packages/@luke-ui/react/src/status-badge/component-test-registration.ts',
			'packages/@luke-ui/react/src/status-badge/index.tsx',
			'packages/@luke-ui/react/src/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.visual.test.tsx',
		]);
		expect(plan.textFileAppends).toEqual([
			{
				kind: 'text-append',
				lines: ["import '../status-badge/recipe.css.js';"],
				path: 'packages/@luke-ui/react/src/styles/component-styles.css.ts',
			},
		]);
		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['StatusBadge', 'status-badge', 'universal', 'none', 'applicable'],",
		]);
		expect(
			plan.files.find((file) => file.path.endsWith('/status-badge/index.tsx'))?.contents,
		).toContain('export { statusBadgeRecipe, type StatusBadgeRecipeVariants }');
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
});
