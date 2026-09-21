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
			'packages/@luke-ui/react/src/core/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/exports/status-badge.ts',
		]);
		expect(plan.files.map((file) => file.path)).not.toContainEqual(
			expect.stringMatching(/core\/status-badge\/index\.ts$/),
		);
		expect(plan).not.toHaveProperty('jsonEdits');
		expect(plan).not.toHaveProperty('importEdits');
		expect(plan).not.toHaveProperty('textFileInserts');

		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.css.ts'),
		)?.contents;
		const componentSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.tsx'),
		)?.contents;
		const packageExportSource = plan.files.find((file) =>
			file.path.endsWith('/exports/status-badge.ts'),
		)?.contents;

		expect(componentSource).not.toContain('export { statusBadgeRecipe');
		expect(packageExportSource).toContain(
			"export { StatusBadge, type StatusBadgeProps } from '../core/status-badge/status-badge.js';",
		);
		expect(packageExportSource).toContain(
			"export { type StatusBadgeRecipeVariants, statusBadgeRecipe } from '../core/status-badge/recipe.css.js';",
		);
		expect(packageExportSource).not.toContain("from './index.js'");
		expect(recipeSource).toContain('export const statusBadgeRecipe = recipe({');
		expect(recipeSource).toContain(
			'export type StatusBadgeRecipeVariants = RecipeSelection<typeof statusBadgeRecipe>;',
		);

		const testSource = plan.files.find((file) =>
			file.path.endsWith('status-badge.browser.test.tsx'),
		)?.contents;
		if (testSource === undefined) {
			throw new Error('Expected the scaffold to write status-badge.browser.test.tsx.');
		}
		expect(testSource).toContain("from '@luke-ui/react/status-badge'");
		expect(testSource).not.toContain("from './index.js'");
		expect(testSource).not.toContain("from './status-badge.js'");
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

	describe('the generated browser test', () => {
		it('covers DOM forwarding, a shared scene, an axe check, and a placeholder behavioural test', () => {
			const plan = createComponentPlan(validAnswers);
			const testSource = plan.files.find((file) =>
				file.path.endsWith('status-badge.browser.test.tsx'),
			)?.contents;
			if (testSource === undefined) throw new Error('Expected the scaffold to write the test.');

			// A short banner tells the author axe/visual coverage is scaffolded by
			// default and can be deleted if it protects nothing meaningful.
			expect(testSource).toContain('scaffold assumes');
			expect(testSource).toContain('delete');

			// DOM-forwarding coverage, sharing the repo-wide assertion helpers.
			expect(testSource).toContain(
				"import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';",
			);
			expect(testSource).toContain('expectForwardsDomProps(target, ref)');

			// One representative scene shared by the axe check and the visual capture.
			expect(testSource).toContain('function StatusBadgeScene()');
			expect(testSource.match(/StatusBadgeScene/g)?.length).toBeGreaterThanOrEqual(3);

			// The axe check.
			expect(testSource).toContain("import { expectNoAxeViolations } from '../test-utils/axe.js';");
			expect(testSource).toContain("test('the StatusBadge scene has no axe violations'");
			expect(testSource).toContain('await expectNoAxeViolations(container)');

			// The tagged visual kitchen-sink case, looping every appearance.
			expect(testSource).toContain("{ tags: ['visual'] }");
			expect(testSource).toContain('for (const appearance of visualAppearances)');
			expect(testSource).toContain(
				"captureVisualAppearance(locator, 'status-badge/kitchen-sink', appearance)",
			);

			// A placeholder behavioural test with a TODO telling the author to
			// replace it with real coverage.
			expect(testSource).toContain('TODO: replace this placeholder');
			expect(testSource).toContain("test('StatusBadge renders its content'");

			// None of the deleted flavours survive.
			expect(testSource).not.toContain('testConformance');
			expect(testSource).not.toContain('testIntegration');
			expect(testSource).not.toContain('conformance');
			expect(testSource).not.toContain('.visual.test');
			expect(testSource).not.toContain('.test-d.ts');
		});

		it('omits the tagged visual case when visual coverage is declined, but keeps the axe scene', () => {
			const plan = createComponentPlan({ ...validAnswers, visualCoverage: false });
			const testSource = plan.files.find((file) =>
				file.path.endsWith('status-badge.browser.test.tsx'),
			)?.contents;
			if (testSource === undefined) throw new Error('Expected the scaffold to write the test.');

			expect(testSource).not.toContain("tags: ['visual']");
			expect(testSource).not.toContain('visualAppearances');
			expect(testSource).not.toContain('captureVisualAppearance');
			expect(testSource).toContain('function StatusBadgeScene()');
			expect(testSource).toContain("test('the StatusBadge scene has no axe violations'");
		});

		it('imports the component from the public package export, not a relative sibling', () => {
			const plan = createComponentPlan(validAnswers);
			const testSource = plan.files.find((file) =>
				file.path.endsWith('status-badge.browser.test.tsx'),
			)?.contents;
			if (testSource === undefined) throw new Error('Expected the scaffold to write the test.');

			// Component tests import the component under test from its public
			// package export, matching hand-authored tests like button.browser.test.tsx
			// and track.browser.test.tsx. Only test-utils stay relative.
			expect(testSource).toContain("import { StatusBadge } from '@luke-ui/react/status-badge';");
			expect(testSource).not.toContain("from './status-badge.js'");
		});
	});
});
