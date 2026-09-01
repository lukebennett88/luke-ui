import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';
import { findComponentPropsTableTags } from '../../../apps/docs/src/lib/component-props-table-tags.js';
import {
	PRIMITIVE_DEFAULTS,
	createPrimitivePlan,
	parsePrimitiveAnswers,
	validatePrimitiveName,
} from './primitive-creation-plan.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

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
});

describe('validatePrimitiveName', () => {
	it('reports primitive-specific validation errors', () => {
		expect(validatePrimitiveName('')).toBe('Primitive name required.');
		expect(validatePrimitiveName(undefined)).toBe('Primitive name required.');
	});
});

describe('createPrimitivePlan', () => {
	it('plans a primitive with docs, a colocated recipe, and a public export module', () => {
		const plan = createPrimitivePlan(validAnswers);

		expect(plan.expected).toEqual({
			exampleSlug: 'status-badge-primitive/basic',
			hostedDocsPath: 'components/primitives/status-badge',
			packageDocsSlug: 'primitives/status-badge',
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
		expect(plan).not.toHaveProperty('sortedImportEdits');
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
		const browserTestSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.browser.test.tsx'),
		)?.contents;
		const guide = plan.files.find((file) =>
			file.path.endsWith('primitives/status-badge.mdx'),
		)?.contents;
		const example = plan.files.find((file) =>
			file.path.endsWith('status-badge-primitive/basic.tsx'),
		)?.contents;

		expect(primitiveSource).toContain('export function StatusBadge');
		expect(recipeSource).toContain('export const statusBadgeRecipe = recipe({');
		expect(recipeSource).toContain("import { recipe } from '../../styles/recipe.js';");
		expect(packageExportSource).toContain(
			"export { StatusBadge, type StatusBadgeProps } from '../../core/primitives/status-badge/status-badge.js';",
		);
		expect(packageExportSource).toContain(
			"export { type StatusBadgeRecipeVariants, statusBadgeRecipe } from '../../core/primitives/status-badge/recipe.css.js';",
		);
		expect(browserTestSource).toContain("test('StatusBadge renders its root element'");
		expect(browserTestSource).not.toContain('testConformance');
		expect(browserTestSource).toContain("from './status-badge.js'");
		expect(example).toContain("from '@luke-ui/react/primitives/status-badge'");
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
			packageDocsSlug: 'primitives/status-badge',
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

	it('scaffolds dom conformance when requested', () => {
		const plan = createPrimitivePlan({ conformance: ['dom'], name: 'StatusBadge' });
		const browserTestSource = plan.files.find((file) =>
			file.path.endsWith('/status-badge/status-badge.browser.test.tsx'),
		)?.contents;
		if (browserTestSource === undefined) {
			throw new Error('Expected the scaffold to write the browser test.');
		}

		expect(browserTestSource).toContain('testConformance');
		expect(browserTestSource).not.toContain("test('StatusBadge renders its root element'");
	});
});

/**
 * Resolves each relative import in a generated file against the repo tree and reports the ones
 * that don't exist. Imports into the primitive's own not-yet-created directory (`./status-badge.js`,
 * `./recipe.css.js`, and similar) are skipped since the plan writes those files together; every
 * other relative import must already resolve to a real file on disk.
 */
async function findUnresolvedImports(file: {
	contents: string;
	path: string;
}): Promise<Array<string>> {
	if (!/\.tsx?$/.test(file.path)) return [];

	const generatedDirectory = path.dirname(path.join(repoRoot, file.path));
	const lang = file.path.endsWith('.tsx') ? 'tsx' : 'ts';
	const parsed = parseSync(file.path, file.contents, { lang });
	const specifiers = parsed.module.staticImports.flatMap((staticImport) => {
		const specifier = staticImport.moduleRequest.value;
		if (!specifier.startsWith('.')) return [];

		return [specifier];
	});

	const resolutions = await Promise.all(
		specifiers.map(async (specifier) => {
			if (specifier.startsWith('./')) return undefined;

			const target = path.resolve(generatedDirectory, specifier);
			const candidates = [target, target.replace(/\.js$/, '.ts'), target.replace(/\.js$/, '.tsx')];
			const found = await Promise.all(
				candidates.map(async (candidate) => {
					try {
						await access(candidate);
						return true;
					} catch {
						return false;
					}
				}),
			);
			if (found.some(Boolean)) return undefined;
			return `${file.path} -> ${specifier}`;
		}),
	);

	return resolutions.filter((resolution): resolution is string => resolution !== undefined);
}
