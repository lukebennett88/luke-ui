import { describe, expect, it } from 'vite-plus/test';
import { ZodError } from 'zod';
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
	it('defaults conformance and docs for omitted answers', () => {
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

	it('rejects unsupported field conformance', () => {
		expect(() => parsePrimitiveAnswers({ conformance: ['field'], name: 'StatusBadge' })).toThrow(
			ZodError,
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
	it('plans invariant wiring with hosted docs and a minimal placeholder implementation', () => {
		const plan = createPrimitivePlan(validAnswers);

		expect(plan.expected).toEqual({
			packageExportPath: './primitives/status-badge',
		});
		expect(plan.files.map((file) => file.path).sort()).toEqual([
			'apps/docs/content/docs/components/primitives/status-badge.mdx',
			'apps/docs/src/examples/status-badge-primitive/basic.tsx',
			'packages/@luke-ui/react/src/core/primitives/status-badge/recipe.ts',
			'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/exports/primitives/status-badge.ts',
		]);
		expect(plan.files.map((file) => file.path)).not.toContain(
			'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.browser.test.tsx',
		);
		expect(plan).not.toHaveProperty('jsonEdits');
		expect(plan).not.toHaveProperty('sortedImportEdits');
		expect(plan).not.toHaveProperty('textFileInserts');

		const recipeSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/recipe.ts'),
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
		expect(primitiveSource).toContain("import type { XStyleProps } from '../../styles/xstyle.js';");
		expect(primitiveSource).toContain('resolveStatusBadgeRecipeStyles');
		expect(recipeSource).toContain('import { createRecipe, createRecipeStyles }');
		expect(recipeSource).toContain(
			'export const resolveStatusBadgeRecipeStyles = createRecipeStyles({',
		);
		expect(recipeSource).toContain(
			'export const statusBadgeRecipe = createRecipe(resolveStatusBadgeRecipeStyles);',
		);
		expect(recipeSource).toContain(
			'export type StatusBadgeRecipeVariants = RecipeSelection<typeof resolveStatusBadgeRecipeStyles>;',
		);
		expect(recipeSource).toContain('root: {},');
		expect(recipeSource).not.toContain('inline-flex');
		expect(recipeSource).not.toContain('createSingleRecipe');
		expect(packageExportSource).toContain(
			"export { StatusBadge, type StatusBadgeProps } from '../../core/primitives/status-badge/status-badge.js';",
		);
		expect(packageExportSource).toContain(
			"export { type StatusBadgeRecipeVariants, statusBadgeRecipe } from '../../core/primitives/status-badge/recipe.js';",
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

	it('scaffolds a DOM conformance test only when requested', () => {
		const withoutDom = createPrimitivePlan(validAnswers);
		expect(withoutDom.files.map((file) => file.path)).not.toContain(
			'packages/@luke-ui/react/src/core/primitives/status-badge/status-badge.browser.test.tsx',
		);

		const withDom = createPrimitivePlan({ conformance: ['dom'], name: 'StatusBadge' });
		const browserTestSource = withDom.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.browser.test.tsx'),
		)?.contents;
		if (browserTestSource === undefined) {
			throw new Error('Expected the scaffold to write the browser test.');
		}

		expect(browserTestSource).toContain('testConformance');
		expect(browserTestSource).toContain("path: 'primitives/status-badge'");
		expect(browserTestSource).not.toContain('getControl');
	});
});
