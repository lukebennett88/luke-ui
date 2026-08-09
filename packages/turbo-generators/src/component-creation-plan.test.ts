import { describe, expect, it } from 'vite-plus/test';
import {
	parseComponentFrontmatter,
	renderPropsPage,
} from '../../../apps/docs/scripts/generate-props-pages.js';
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
			exampleSlug: 'status-badge/basic',
			hostedDocsPath: 'components/feedback/status-badge',
			packageDocsSlug: 'status-badge',
			packageExportPath: './status-badge',
		});
		expect(plan.files.map((file) => file.path).sort()).toEqual([
			'apps/docs/content/docs/components/feedback/status-badge/index.mdx',
			'apps/docs/src/examples/status-badge/basic.tsx',
			'packages/@luke-ui/react/src/recipes/status-badge.css.ts',
			'packages/@luke-ui/react/src/status-badge/component-test-registration.ts',
			'packages/@luke-ui/react/src/status-badge/index.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/status-badge/status-badge.visual.test.tsx',
		]);
		const guide = plan.files.find((file) => {
			return file.path.endsWith('/status-badge/index.mdx');
		})?.contents;
		expect(guide).toContain('src="status-badge/basic"');
		expect(guide).not.toContain('description=');
		expect(guide).not.toContain('TODO');
		expect(guide).toContain('source: packages/@luke-ui/react/src/status-badge');
		expect(guide).toContain('name: StatusBadgeProps');
		expect(guide).toContain('path: packages/@luke-ui/react/src/status-badge/index.tsx');
		expect(
			plan.files.find((file) => file.path.endsWith('/examples/status-badge/basic.tsx'))?.contents,
		).toContain('<StatusBadge>StatusBadge</StatusBadge>');
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
		expect(plan.textFileAppends).toEqual([
			{
				kind: 'text-append',
				path: 'packages/@luke-ui/react/src/recipes/index.ts',
				lines: [
					"export type { StatusBadgeVariants } from '../recipes/status-badge.css.js';",
					"export { statusBadge } from '../recipes/status-badge.css.js';",
				],
			},
		]);
		expect(plan.textFileInserts).toEqual([
			{
				kind: 'text-insert',
				lines: ["\t['StatusBadge', 'status-badge', 'atom', 'universal', 'none', 'applicable'],"],
				marker:
					'].map(([name, path, tier, conformanceTier, integrationTripwire, visualApplicability]) => ({',
				path: 'packages/@luke-ui/react/src/conformance/manifest.ts',
			},
		]);
		expect(
			plan.files.find((file) => file.path.endsWith('/status-badge/index.tsx'))?.contents,
		).toContain("export interface StatusBadgeProps extends ComponentProps<'div'> {}");
		expect(plan.files.find((file) => file.path.endsWith('.browser.test.tsx'))?.contents).toContain(
			'testUniversalConformance',
		);
		expect(
			plan.files.find((file) => file.path.endsWith('component-test-registration.ts'))?.contents,
		).toContain("path: 'status-badge'");
		expect(
			plan.files.find((file) => file.path.endsWith('/recipes/status-badge.css.ts'))?.contents,
		).not.toContain('StatusBadgeVariants');

		const story = plan.files.find((file) => {
			return file.path.endsWith('/status-badge/status-badge.stories.tsx');
		})?.contents;

		expect(story).toContain("children: 'StatusBadge'");
		expect(story).not.toContain('TODO');
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
		expect(plan.textFileAppends).toEqual([]);
	});

	it('omits visual coverage when it does not apply', () => {
		const plan = createComponentPlan({
			docsGroup: 'forms',
			name: 'DateField',
			styling: 'none',
			tier: 'composed',
			visualCoverage: false,
		});

		expect(plan.files.map((file) => file.path)).not.toContain(
			'packages/@luke-ui/react/src/date-field/date-field.visual.test.tsx',
		);
		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['DateField', 'date-field', 'composed', 'universal', 'none', 'none'],",
		]);
		expect(plan.files.map((file) => file.path)).toContain(
			'packages/@luke-ui/react/src/date-field/date-field.browser.test.tsx',
		);
	});

	it('uses explicit applicability overrides in the manifest entry', () => {
		const plan = createComponentPlan({
			docsGroup: 'forms',
			name: 'DateField',
			styling: 'none',
			tier: 'composed',
			conformanceTier: 'field-shaped',
			integrationTripwire: true,
			visualCoverage: false,
		});

		expect(plan.textFileInserts?.[0]?.lines).toEqual([
			"\t['DateField', 'date-field', 'composed', 'field-shaped', 'required', 'none'],",
		]);
		expect(
			plan.files.find((file) => file.path.endsWith('/date-field.browser.test.tsx'))?.contents,
		).toMatch(/testFieldShapedConformance[\s\S]*testIntegration/);
		expect(
			plan.files.find((file) => file.path.endsWith('/date-field.browser.test.tsx'))?.contents,
		).toContain(
			"import { testFieldShapedConformance, testIntegration } from '../conformance/helpers.js';",
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

	it('scaffolds a index.mdx that generate:props can turn into a props.mdx', () => {
		const plan = createComponentPlan({
			docsGroup: 'feedback',
			name: 'StatusBadge',
			styling: 'none',
			tier: 'atom',
		});

		const guide = plan.files.find((file) =>
			file.path.endsWith('/status-badge/index.mdx'),
		)?.contents;
		if (guide === undefined) throw new Error('Expected the scaffold to write index.mdx.');

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
