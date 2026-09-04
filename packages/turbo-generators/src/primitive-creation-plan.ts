import * as z from 'zod';
import { renderComponentPropsTable } from './creation-plan-docs.js';
import type { CreationWork, PlanFile } from './creation-plan-types.js';
import { formatConformanceList } from './generator-shared.js';
import { toCamelCase, toDisplayName, toKebabCase, validateScaffoldName } from './naming.js';

/** Conformance contracts the primitive scaffold can satisfy today. */
export const PRIMITIVE_CONFORMANCE_CONTRACTS = ['dom'] as const;

export const PRIMITIVE_DEFAULTS = {
	conformance: [],
	docs: true,
} as const;

export interface PrimitiveCreationPlan {
	expected: {
		packageExportPath: string;
	};
	files: Array<PlanFile>;
}

interface PrimitiveCreationWork extends PrimitiveCreationPlan, CreationWork {}

const primitiveAnswersSchema = z.object({
	conformance: z
		.array(z.enum(PRIMITIVE_CONFORMANCE_CONTRACTS))
		.default([...PRIMITIVE_DEFAULTS.conformance]),
	docs: z.boolean().default(PRIMITIVE_DEFAULTS.docs),
	name: z.string(),
});

export type CreatePrimitiveInput = z.input<typeof primitiveAnswersSchema>;
type ParsedPrimitiveAnswers = z.output<typeof primitiveAnswersSchema>;

export function validatePrimitiveName(value: unknown): true | string {
	return validateScaffoldName(value, 'primitive');
}

export function parsePrimitiveAnswers(answers: unknown): ParsedPrimitiveAnswers {
	const parsed = primitiveAnswersSchema.parse(answers);
	const nameCheck = validatePrimitiveName(parsed.name);
	if (nameCheck !== true) {
		throw new Error(nameCheck);
	}
	return parsed;
}

export function createPrimitivePlan(answers: CreatePrimitiveInput): PrimitiveCreationPlan {
	const { expected, files } = createPrimitiveWork(parsePrimitiveAnswers(answers));
	return { expected, files };
}

export function createPrimitiveWork(input: ParsedPrimitiveAnswers): PrimitiveCreationWork {
	const name = toKebabCase(input.name);
	const displayName = toDisplayName(name);
	const pascalName = displayName.replaceAll(' ', '');
	const camelName = toCamelCase(name);
	const recipeName = `${camelName}Recipe`;
	const resolveStylesName = `resolve${pascalName}RecipeStyles`;
	const variantsType = `${pascalName}RecipeVariants`;
	const packagePath = `@luke-ui/react/primitives/${name}`;
	const docsTitle = `${displayName} primitive`;
	const hasDomConformance = input.conformance.includes('dom');
	const conformance = hasDomConformance ? (['dom'] as const) : ([] as const);

	// Most primitives on main are multi-part compositions without a single root. The scaffold keeps
	// a minimal div and recipe so the public export and stylesheet registration can build; replace
	// both when the real primitive shape is known.
	const files: Array<PlanFile> = [
		{
			contents: renderPrimitiveSource({ pascalName, resolveStylesName }),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/${name}.tsx`,
		},
		{
			contents: renderPackageExport({ name, pascalName, recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/exports/primitives/${name}.ts`,
		},
		{
			contents: renderRecipe({ pascalName, recipeName, resolveStylesName, variantsType }),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/recipe.ts`,
		},
	];

	if (hasDomConformance) {
		files.push({
			contents: renderDomConformanceTest({ name, pascalName }),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/${name}.browser.test.tsx`,
		});
	}

	if (input.docs) {
		files.push(
			{
				contents: renderHostedExample({ packagePath, pascalName }),
				path: `apps/docs/src/examples/${name}-primitive/basic.tsx`,
			},
			{
				contents: renderHostedDocsPage({ docsTitle, name, pascalName }),
				path: `apps/docs/content/docs/components/primitives/${name}.mdx`,
			},
		);
	}

	return {
		expected: {
			packageExportPath: `./primitives/${name}`,
		},
		files,
		jsonEdits: input.docs
			? [
					{
						key: 'pages',
						kind: 'array-add-append-unique',
						path: 'apps/docs/content/docs/components/primitives/meta.json',
						title: 'Primitives',
						value: name,
					},
				]
			: [],
		sortedImportEdits: [],
		textFileInserts: [
			{
				kind: 'text-insert',
				lines: [
					`\t['${docsTitle}', 'primitives/${name}', ${formatConformanceList(conformance)}, 'none', 'none'],`,
				],
				marker: '].map(([name, path, conformance, integrationTripwire, visualApplicability]) => ({',
				path: 'packages/@luke-ui/react/src/core/conformance/manifest.ts',
			},
		],
	};
}

function renderPrimitiveSource(input: { pascalName: string; resolveStylesName: string }): string {
	return `import type { ComponentProps, JSX } from 'react';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import { ${input.resolveStylesName} } from './recipe.js';

/** Props for the \`${input.pascalName}\` primitive. */
export interface ${input.pascalName}Props extends ComponentProps<'div'>, XStyleProps {}

/** Primitive \`${input.pascalName}\`. */
export function ${input.pascalName}(props: ${input.pascalName}Props): JSX.Element {
	const { className, style, xstyle, ...divProps } = props;
	const stylexProps = resolveXStyleProps(${input.resolveStylesName}(), xstyle, className, style);
	return <div {...divProps} {...stylexProps} />;
}
`;
}

function renderPackageExport(input: {
	name: string;
	pascalName: string;
	recipeName: string;
	variantsType: string;
}): string {
	return `export { ${input.pascalName}, type ${input.pascalName}Props } from '../../core/primitives/${input.name}/${input.name}.js';
export { type ${input.variantsType}, ${input.recipeName} } from '../../core/primitives/${input.name}/recipe.js';
`;
}

function renderRecipe(input: {
	pascalName: string;
	recipeName: string;
	resolveStylesName: string;
	variantsType: string;
}): string {
	return `import * as stylex from '@stylexjs/stylex';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {},
});

/** Canonical resolver for the \`${input.pascalName}\` primitive's recipe. */
export const ${input.resolveStylesName} = createRecipeStyles({
	base: styles.root,
});

/** Recipe for the \`${input.pascalName}\` primitive. */
export const ${input.recipeName} = createRecipe(${input.resolveStylesName});

export type ${input.variantsType} = RecipeSelection<typeof ${input.resolveStylesName}>;
`;
}

function renderHostedExample(input: { packagePath: string; pascalName: string }): string {
	return `import { ${input.pascalName} } from '${input.packagePath}';

export default () => {
	return <${input.pascalName}>${input.pascalName}</${input.pascalName}>;
};
`;
}

function renderHostedDocsPage(input: {
	docsTitle: string;
	name: string;
	pascalName: string;
}): string {
	const exampleSlug = `${input.name}-primitive/basic`;
	const propsPath = `packages/@luke-ui/react/src/core/primitives/${input.name}/${input.name}.tsx`;
	const propsTable = renderComponentPropsTable({
		name: `${input.pascalName}Props`,
		path: propsPath,
	});

	return `---
title: ${input.docsTitle}
source: packages/@luke-ui/react/src/exports/primitives/${input.name}.ts
---

<ExampleBlock
	src="${exampleSlug}"
	title="${input.docsTitle} — Basic"
/>

## API

${propsTable}
`;
}

function renderDomConformanceTest(input: { name: string; pascalName: string }): string {
	return `import { testConformance } from '../../conformance/helpers.js';
import { render } from '../../test-utils/render.js';
import { ${input.pascalName} } from './${input.name}.js';

testConformance({
	path: 'primitives/${input.name}',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected ${input.pascalName} element.');
		return target;
	},
	render: (props = {}) => render(<${input.pascalName} {...props}>Content</${input.pascalName}>),
});
`;
}
