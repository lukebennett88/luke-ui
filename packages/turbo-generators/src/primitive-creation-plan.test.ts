import { describe, expect, it } from 'vite-plus/test';
import { findComponentPropsTableTags } from '../../../apps/docs/src/lib/component-props-table-tags.js';
import {
	PRIMITIVE_DEFAULTS,
	createPrimitivePlan,
	parsePrimitiveAnswers,
	validatePrimitiveName,
} from './primitive-creation-plan.js';
import { findUnresolvedImports } from './test-utils/find-unresolved-imports.js';

const validAnswers = {
	name: 'StatusBadge',
} as const;

describe('parsePrimitiveAnswers', () => {
	it('defaults docs and visual coverage for omitted answers', () => {
		expect(parsePrimitiveAnswers(validAnswers)).toEqual({
			...PRIMITIVE_DEFAULTS,
			name: 'StatusBadge',
		});
	});

	it('rejects invalid primitive names before file writes', () => {
		expect(() => parsePrimitiveAnswers({ name: '../Bad' })).toThrow(
			'Use letters/numbers/hyphens. Start with a letter.',
		);
	});
});

describe('validatePrimitiveName', () => {
	it('reports primitive-specific validation errors', () => {
		expect(validatePrimitiveName('')).toBe('Primitive name required.');
		expect(validatePrimitiveName(undefined)).toBe('Primitive name required.');
	});
});

describe('createPrimitivePlan', () => {
	it('plans invariant wiring with hosted docs, a complete browser test, and a minimal placeholder implementation', () => {
		const plan = createPrimitivePlan(validAnswers);

		expect(plan.expected).toEqual({
			packageExportPath: './primitives/status-badge',
		});
		expect(plan.files.map((file) => file.path).sort()).toEqual([
			'apps/docs/content/docs/components/primitives/status-badge.mdx',
			'apps/docs/src/examples/status-badge-primitive/basic.tsx',
			'packages/@luke-ui/react/src/core/primitives/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/exports/primitives/status-badge.ts',
		]);
		expect(plan).not.toHaveProperty('jsonEdits');
		expect(plan).not.toHaveProperty('importEdits');
		expect(plan).not.toHaveProperty('textFileInserts');

		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.css.ts'),
		)?.contents;
		const primitiveSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.tsx'),
		)?.contents;
		const packageExportSource = plan.files.find((file) =>
			file.path.endsWith('/exports/primitives/status-badge.ts'),
		)?.contents;
		const guide = plan.files.find((file) =>
			file.path.endsWith('primitives/status-badge.mdx'),
		)?.contents;
		const example = plan.files.find((file) =>
			file.path.endsWith('status-badge-primitive/basic.tsx'),
		)?.contents;

		expect(primitiveSource).toContain('export function StatusBadge');
		expect(recipeSource).toContain('export const statusBadgeRecipe = recipe({');
		expect(recipeSource).toContain('base: {},');
		expect(recipeSource).not.toContain('inline-flex');
		expect(packageExportSource).toContain(
			"export { StatusBadge, type StatusBadgeProps } from '../../core/primitives/status-badge/status-badge.js';",
		);
		expect(packageExportSource).toContain(
			"export { type StatusBadgeRecipeVariants, statusBadgeRecipe } from '../../core/primitives/status-badge/recipe.css.js';",
		);
		expect(example).toContain("from '@luke-ui/react/primitives/status-badge'");
		expect(example).toContain('export default () => {');
		expect(example).not.toContain('export default function Basic');
		if (guide === undefined) throw new Error('Expected the scaffold to write the guide.');
		expect(findComponentPropsTableTags(guide)).toEqual([
			{
				name: 'StatusBadgeProps',
				path: 'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.tsx',
			},
		]);
		expect(guide).toContain('src="status-badge-primitive/basic"');
	});

	it('omits hosted docs when docs are disabled', () => {
		const plan = createPrimitivePlan({ docs: false, name: 'StatusBadge' });

		expect(plan.expected).toEqual({
			packageExportPath: './primitives/status-badge',
		});
		expect(plan.files.map((file) => file.path)).not.toEqual(
			expect.arrayContaining([
				'apps/docs/content/docs/components/primitives/status-badge.mdx',
				'apps/docs/src/examples/status-badge-primitive/basic.tsx',
			]),
		);
	});

	it('emits relative imports that resolve to real files already in the repo', async () => {
		const plan = createPrimitivePlan(validAnswers);

		const violations = (
			await Promise.all(plan.files.map((file) => findUnresolvedImports(file)))
		).flat();

		expect(violations).toEqual([]);
	});

	describe('the generated browser test', () => {
		it('covers DOM forwarding, a shared scene, an axe check, and a placeholder behavioural test', () => {
			const plan = createPrimitivePlan(validAnswers);
			const testSource = plan.files.find((file) =>
				file.path.endsWith('status-badge.browser.test.tsx'),
			)?.contents;
			if (testSource === undefined) throw new Error('Expected the scaffold to write the test.');

			expect(testSource).toContain('TODO: Test actual behaviour or delete.');
			expect(testSource).toContain(
				"import { expectForwardsDomProps, expectHtmlElement } from '../../test-utils/forwarding.js';",
			);
			expect(testSource).toContain('expectForwardsDomProps(target, ref)');

			expect(testSource).toContain('function StatusBadgeScene()');
			expect(testSource.match(/StatusBadgeScene/g)?.length).toBeGreaterThanOrEqual(3);

			expect(testSource).toContain(
				"import { expectNoAxeViolations } from '../../test-utils/axe.js';",
			);
			expect(testSource).toContain("test('the StatusBadge scene has no axe violations'");
			expect(testSource).toContain('await expectNoAxeViolations(container)');

			expect(testSource).toContain("{ tags: ['visual'] }");
			expect(testSource).toContain('for (const appearance of visualAppearances)');
			expect(testSource).toContain(
				"captureVisualAppearance(locator, 'status-badge/kitchen-sink', appearance)",
			);

			expect(testSource).toContain("test('StatusBadge renders its content'");

			expect(testSource).not.toContain('testConformance');
			expect(testSource).not.toContain('conformance');
		});

		it('omits the tagged visual case when visual coverage is declined, but keeps the axe scene', () => {
			const plan = createPrimitivePlan({ ...validAnswers, visualCoverage: false });
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

		it('imports the primitive from the public package export, not a relative sibling', () => {
			const plan = createPrimitivePlan(validAnswers);
			const testSource = plan.files.find((file) =>
				file.path.endsWith('status-badge.browser.test.tsx'),
			)?.contents;
			if (testSource === undefined) throw new Error('Expected the scaffold to write the test.');

			expect(testSource).toContain(
				"import { StatusBadge } from '@luke-ui/react/primitives/status-badge';",
			);
			expect(testSource).not.toContain("from './status-badge.js'");
		});
	});
});
