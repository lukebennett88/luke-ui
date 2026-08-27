import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';
import { ZodError } from 'zod';
import { parseComponentFrontmatter } from '../../../apps/docs/src/lib/docs-frontmatter.js';
import {
	COMPONENT_DEFAULTS,
	createComponentPlan,
	parseComponentAnswers,
} from './component-creation-plan.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

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
			'packages/@luke-ui/react/src/core/status-badge/index.ts',
			'packages/@luke-ui/react/src/core/status-badge/recipe.css.ts',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.browser.test.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.stories.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx',
			'packages/@luke-ui/react/src/core/status-badge/status-badge.visual.test.tsx',
			'packages/@luke-ui/react/src/exports/status-badge.ts',
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

	it('scaffolds a <group>/<name>.mdx guide that generate:props can turn into a props.mdx', () => {
		const plan = createComponentPlan(validAnswers);

		const guide = plan.files.find((file) => {
			return file.path.endsWith('feedback/status-badge.mdx');
		})?.contents;
		if (guide === undefined) throw new Error('Expected the scaffold to write the guide.');

		const frontmatter = parseComponentFrontmatter(guide);
		expect(frontmatter.props).toEqual([
			{
				name: 'StatusBadgeProps',
				path: 'packages/@luke-ui/react/src/core/status-badge/status-badge.tsx',
			},
		]);
	});

	it('generates a valid browser test for the default DOM contract', () => {
		const plan = createComponentPlan(validAnswers);

		const testFile = plan.files.find((file) => file.path.endsWith('.browser.test.tsx'));
		if (testFile === undefined) throw new Error('Expected the scaffold to write a browser test.');

		const parsed = parseSync(testFile.path, testFile.contents, { lang: 'tsx' });
		expect(parsed.errors).toEqual([]);
		expect(testFile.contents).toContain('testConformance');
		expect(testFile.contents).toContain('getTarget');
		expect(testFile.contents).not.toContain('getControl');
		expect(testFile.contents).not.toContain('testUniversalConformance');
	});

	it('generates a valid browser test for an empty conformance list', () => {
		const plan = createComponentPlan({ ...validAnswers, conformance: [] });

		const testFile = plan.files.find((file) => file.path.endsWith('.browser.test.tsx'));
		if (testFile === undefined) throw new Error('Expected the scaffold to write a browser test.');

		const parsed = parseSync(testFile.path, testFile.contents, { lang: 'tsx' });
		expect(parsed.errors).toEqual([]);
		expect(testFile.contents).toContain("test('StatusBadge renders its root element'");
		expect(testFile.contents).not.toContain('testConformance');
	});

	it('generates a valid browser test for stacked DOM and field contracts', () => {
		const plan = createComponentPlan({ ...validAnswers, conformance: ['field', 'dom'] });

		const testFile = plan.files.find((file) => file.path.endsWith('.browser.test.tsx'));
		if (testFile === undefined) throw new Error('Expected the scaffold to write a browser test.');

		const parsed = parseSync(testFile.path, testFile.contents, { lang: 'tsx' });
		expect(parsed.errors).toEqual([]);
		expect(testFile.contents).toContain('testConformance');
		expect(testFile.contents).toContain('getControl');
		expect(testFile.contents).toContain('getTarget');
	});
});

/**
 * Resolves each relative import in a generated file against the repo tree and reports the ones
 * that don't exist. Imports into the component's own not-yet-created directory (`./index.js`,
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
	const specifiers = parsed.module.staticImports
		.map((staticImport) => staticImport.moduleRequest.value)
		.filter((specifier) => specifier.startsWith('.'));

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
