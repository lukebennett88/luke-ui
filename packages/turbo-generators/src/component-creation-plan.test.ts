import { describe, expect, it } from 'vite-plus/test';
import { createComponentPlan } from './component-creation-plan.js';

describe('createComponentPlan', () => {
	it('plans an atom with recipe styling across package and hosted docs surfaces', () => {
		const plan = createComponentPlan({
			docsGroup: 'feedback',
			name: 'StatusBadge',
			styling: 'recipe',
			tier: 'atom',
		});

		expect(plan.expected).toEqual({
			hostedDocsPath: 'components/feedback/status-badge',
			packageDocsSlug: 'status-badge',
			packageExportPath: './status-badge',
			storySlug: 'status-badge',
		});
		expect(plan.files.map((file) => file.path).sort()).toEqual([
			'apps/docs/content/docs/components/feedback/status-badge.mdx',
			'apps/docs/src/status-badge/status-badge.story.tsx',
			'packages/@luke-ui/react/src/recipes/status-badge.css.ts',
			'packages/@luke-ui/react/src/status-badge/index.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.docs.md',
			'packages/@luke-ui/react/src/status-badge/status-badge.stories.tsx',
		]);
		expect(plan.jsonEdits).toEqual([
			{
				key: 'pages',
				kind: 'array-add-sorted',
				path: 'apps/docs/content/docs/components/meta.json',
				title: 'Feedback',
				value: 'feedback',
			},
			{
				key: 'pages',
				kind: 'array-add-sorted',
				path: 'apps/docs/content/docs/components/feedback/meta.json',
				title: 'Feedback',
				value: 'status-badge',
			},
		]);
		expect(
			plan.files.find((file) => file.path.endsWith('/status-badge/index.tsx'))?.contents,
		).toContain("export interface StatusBadgeProps extends ComponentProps<'div'> {}");
		expect(
			plan.files.find((file) => file.path.endsWith('/recipes/status-badge.css.ts'))?.contents,
		).not.toContain('StatusBadgeVariants');
		const recipe = plan.files.find((file) => {
			return file.path.endsWith('/recipes/status-badge.css.ts');
		})?.contents;

		expect(recipe).toContain("import { recipe } from '@vanilla-extract/recipes';");
		expect(recipe).toContain("'@layer': {\n\t\t\trecipes: {");
		expect(recipe).not.toContain('recipeInLayer');
		expect(recipe).not.toContain('layered-style');

		const story = plan.files.find((file) => {
			return file.path.endsWith('/status-badge/status-badge.stories.tsx');
		})?.contents;

		expect(story).toContain('/** TODO: Explain when a consumer should use this component. */');
		expect(story).toContain("children: 'StatusBadge'");
		expect(story).not.toContain('render:');
		expect(story).not.toContain('play:');
	});

	it('plans a composed component without recipe files', () => {
		const plan = createComponentPlan({
			docsGroup: 'forms',
			name: 'DateField',
			styling: 'none',
			tier: 'composed',
		});

		expect(plan.files.some((file) => file.path.includes('/recipes/'))).toBe(false);
		expect(plan.files).toContainEqual(
			expect.objectContaining({
				path: 'packages/@luke-ui/react/src/date-field/index.tsx',
			}),
		);
	});

	it('rejects invalid component names before file writes', () => {
		expect(() => {
			return createComponentPlan({
				docsGroup: 'forms',
				name: '../Bad',
				styling: 'none',
				tier: 'atom',
			});
		}).toThrow('Use letters/numbers/hyphens. Start with a letter.');
	});

	it('keeps editorial docs surfaces out of the plan', () => {
		const plan = createComponentPlan({
			docsGroup: 'actions',
			name: 'MenuButton',
			styling: 'recipe',
			tier: 'composed',
		});

		expect(plan.files.map((file) => file.path)).not.toContain('apps/docs/content/docs/index.mdx');
		expect(plan.files.map((file) => file.path)).not.toContain(
			'apps/docs/content/docs/getting-started.mdx',
		);
		expect(plan.jsonEdits.map((edit) => edit.path)).toEqual([
			'apps/docs/content/docs/components/meta.json',
			'apps/docs/content/docs/components/actions/meta.json',
		]);
	});

	it('omits cx from components without styling', () => {
		const plan = createComponentPlan({
			docsGroup: 'feedback',
			name: 'PlainBadge',
			styling: 'none',
			tier: 'atom',
		});

		const source = plan.files.find((file) => {
			return file.path.endsWith('/plain-badge/index.tsx');
		})?.contents;

		expect(source).not.toContain("import { cx } from '../utils/index.js';");
		expect(source).not.toContain('cx(');
		expect(source).toContain('className={className}');
	});
});
