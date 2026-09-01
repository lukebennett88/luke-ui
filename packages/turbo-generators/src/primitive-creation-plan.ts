import * as z from 'zod';
import { CONFORMANCE_CONTRACTS } from './component-creation-plan.js';
import type { ConformanceContract } from './component-creation-plan.js';
import type { CreationWork, PlanFile } from './creation-plan-types.js';
import { toCamelCase, toDisplayName, toKebabCase, validateScaffoldName } from './naming.js';

export const PRIMITIVE_DEFAULTS = {
	conformance: ['dom'],
} as const;

export interface PrimitiveCreationPlan {
	expected: {
		packageDocsSlug: string;
		packageExportPath: string;
	};
	files: Array<PlanFile>;
}

interface PrimitiveCreationWork extends PrimitiveCreationPlan, CreationWork {}

const primitiveAnswersSchema = z.object({
	conformance: z.array(z.enum(CONFORMANCE_CONTRACTS)).default([...PRIMITIVE_DEFAULTS.conformance]),
	name: z.string(),
});

export type CreatePrimitiveInput = z.input<typeof primitiveAnswersSchema>;
type ParsedPrimitiveAnswers = z.output<typeof primitiveAnswersSchema>;

export function validatePrimitiveName(value: unknown): true | string {
	return validateScaffoldName(value);
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
	const variantsType = `${pascalName}RecipeVariants`;
	const packagePath = `@luke-ui/react/primitives/${name}`;
	const conformance = [...CONFORMANCE_CONTRACTS].filter((contract) =>
		input.conformance.includes(contract),
	);

	const files: Array<PlanFile> = [
		{
			contents: renderPrimitiveSource({
				camelName,
				name,
				packagePath,
				pascalName,
				recipeName,
				variantsType,
			}),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/${name}.tsx`,
		},
		{
			contents: renderPackageExport({ name, pascalName, recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/exports/primitives/${name}.ts`,
		},
		{
			contents: renderRecipe({ recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/recipe.css.ts`,
		},
		{
			contents: renderPrimitiveTest({
				conformance,
				name,
				pascalName,
			}),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/${name}.browser.test.tsx`,
		},
	];

	return {
		expected: {
			packageDocsSlug: `primitives/${name}`,
			packageExportPath: `./primitives/${name}`,
		},
		files,
		jsonEdits: [],
		sortedImportEdits: [
			{
				kind: 'sorted-import',
				line: `import '../primitives/${name}/recipe.css.js';`,
				path: 'packages/@luke-ui/react/src/core/styles/modules.css.ts',
			},
		],
		textFileInserts: [
			{
				kind: 'text-insert',
				lines: [
					`\t['${displayName} primitive', 'primitives/${name}', ${formatConformanceList(conformance)}, 'none', 'none'],`,
				],
				marker: '].map(([name, path, conformance, integrationTripwire, visualApplicability]) => ({',
				path: 'packages/@luke-ui/react/src/core/conformance/manifest.ts',
			},
		],
	};
}

function formatConformanceList(conformance: ReadonlyArray<ConformanceContract>): string {
	if (conformance.length === 0) return '[]';
	return `[${conformance.map((contract) => `'${contract}'`).join(', ')}]`;
}

function renderPrimitiveSource(input: {
	camelName: string;
	name: string;
	packagePath: string;
	pascalName: string;
	recipeName: string;
	variantsType: string;
}): string {
	return `import type { ComponentProps, JSX } from 'react';
import { cx } from '../../../shared/utils/utils.js';
import { ${input.recipeName} } from './recipe.css.js';

/** Props for the \`${input.pascalName}\` primitive. */
export interface ${input.pascalName}Props extends ComponentProps<'div'> {}

/** Primitive \`${input.pascalName}\`. */
export function ${input.pascalName}(props: ${input.pascalName}Props): JSX.Element {
	const { className, ...divProps } = props;
	return <div {...divProps} className={cx(${input.recipeName}(), className)} />;
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
export { type ${input.variantsType}, ${input.recipeName} } from '../../core/primitives/${input.name}/recipe.css.js';
`;
}

function renderRecipe(input: { recipeName: string; variantsType: string }): string {
	return `import type { RecipeSelection } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

export const ${input.recipeName} = recipe({
	base: {
		display: 'inline-flex',
	},
});

export type ${input.variantsType} = RecipeSelection<typeof ${input.recipeName}>;
`;
}

function renderPrimitiveTest(input: {
	conformance: ReadonlyArray<ConformanceContract>;
	name: string;
	pascalName: string;
}): string {
	const hasDom = input.conformance.includes('dom');
	const hasField = input.conformance.includes('field');
	const helperImports = [hasDom || hasField ? 'testConformance' : undefined].filter(
		(value): value is string => value != null,
	);
	const imports = [
		...(helperImports.length > 0
			? [`import { ${helperImports.join(', ')} } from '../../conformance/helpers.js';`]
			: ["import { expect, test } from 'vite-plus/test';"]),
		"import { render } from '../../test-utils/render.js';",
		`import { ${input.pascalName} } from './${input.name}.js';`,
	];

	const renderComponent = `render(<${input.pascalName} {...props}>Content</${input.pascalName}>)`;
	const locators = [
		hasField
			? `	getControl: (result) => {
		const control = result.container.querySelector('[name="conformance-field"]');
		if (!(control instanceof HTMLElement)) throw new Error('Expected a native field control.');
		return control;
	},`
			: undefined,
		hasDom
			? `	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected ${input.pascalName} element.');
		return target;
	},`
			: undefined,
	].filter((value): value is string => value != null);
	const contract =
		hasDom || hasField
			? `testConformance({
	path: 'primitives/${input.name}',
${locators.join('\n')}
	render: (props = {}) => ${renderComponent},
});`
			: `test('${input.pascalName} renders its root element', () => {
	const result = render(<${input.pascalName}>Content</${input.pascalName}>);
	expect(result.locator.element().firstElementChild).toHaveTextContent('Content');
});`;

	return `${imports.join('\n')}

${contract}
`;
}
