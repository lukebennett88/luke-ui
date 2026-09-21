import * as z from 'zod';
import { renderComponentPropsTable } from './creation-plan-docs.js';
import type { CreationWork, PlanFile } from './creation-plan-types.js';
import { toCamelCase, toDisplayName, toKebabCase, validateScaffoldName } from './naming.js';

export const PRIMITIVE_DEFAULTS = {
	docs: true,
	visualCoverage: true,
} as const;

export interface PrimitiveCreationPlan {
	expected: {
		packageExportPath: string;
	};
	files: Array<PlanFile>;
}

interface PrimitiveCreationWork extends PrimitiveCreationPlan, CreationWork {}

const primitiveAnswersSchema = z.object({
	docs: z.boolean().default(PRIMITIVE_DEFAULTS.docs),
	name: z.string(),
	visualCoverage: z.boolean().default(PRIMITIVE_DEFAULTS.visualCoverage),
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
	const variantsType = `${pascalName}RecipeVariants`;
	const packagePath = `@luke-ui/react/primitives/${name}`;
	const docsTitle = `${displayName} primitive`;

	// Most primitives on main are multi-part compositions without a single root. The scaffold keeps
	// a minimal div and recipe so the public export and stylesheet registration can build; replace
	// both when the real primitive shape is known.
	const files: Array<PlanFile> = [
		{
			contents: renderPrimitiveSource({ pascalName, recipeName }),
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
				name,
				packagePath,
				pascalName,
				visualCoverage: input.visualCoverage,
			}),
			path: `packages/@luke-ui/react/src/core/primitives/${name}/${name}.browser.test.tsx`,
		},
	];

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
		importEdits: [
			{
				kind: 'import',
				line: `import '../primitives/${name}/recipe.css.js';`,
				path: 'packages/@luke-ui/react/src/core/styles/modules.css.ts',
			},
		],
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
		textFileInserts: [],
	};
}

function renderPrimitiveSource(input: { pascalName: string; recipeName: string }): string {
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
	base: {},
});

export type ${input.variantsType} = RecipeSelection<typeof ${input.recipeName}>;
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

/**
 * The generated `*.browser.test.tsx` follows the same model as the component
 * generator's: a DOM-forwarding assertion, a shared representative scene used
 * by both the axe check and the visual capture, and a TODO'd behavioural test
 * for the author to replace. The scaffold is opinionated on purpose — the
 * philosophy is "generate it, then delete what is clearly unnecessary".
 *
 * Primitives live one directory deeper than components
 * (`src/core/primitives/<name>/` vs `src/core/<name>/`), so its test-utils
 * imports go up an extra level (`../../test-utils/...`).
 */
function renderPrimitiveTest(input: {
	name: string;
	packagePath: string;
	pascalName: string;
	visualCoverage: boolean;
}): string {
	const sceneName = `${input.pascalName}Scene`;

	const imports = [
		`import { ${input.pascalName} } from '${input.packagePath}';`,
		"import { createRef } from 'react';",
		"import { expect, test } from 'vite-plus/test';",
		"import { expectNoAxeViolations } from '../../test-utils/axe.js';",
		"import { expectForwardsDomProps, expectHtmlElement } from '../../test-utils/forwarding.js';",
		...(input.visualCoverage
			? ["import { render, visualAppearances } from '../../test-utils/render.js';"]
			: ["import { render } from '../../test-utils/render.js';"]),
		...(input.visualCoverage
			? ["import { captureVisualAppearance, Grid } from '../../test-utils/visual.js';"]
			: ["import { Grid } from '../../test-utils/visual.js';"]),
	];

	const scene = `/**
 * The representative scene, shared by the axe check and the visual capture so
 * both cover the same surface. Replace its contents with the variants that
 * actually exist for ${input.pascalName} (tones, sizes, states, ...).
 */
function ${sceneName}() {
	return (
		<Grid columns={2}>
			<${input.pascalName}>Default</${input.pascalName}>
			<${input.pascalName}>With content</${input.pascalName}>
		</Grid>
	);
}`;

	const forwardingTest = `test('${input.pascalName} forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLDivElement>();
	const { container } = render(
		<${input.pascalName}
			className="forwarded-class"
			data-forwarded="true"
			id="forwarded-id"
			ref={ref}
		>
			Content
		</${input.pascalName}>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected ${input.pascalName} element.');

	expectForwardsDomProps(target, ref);
});`;

	const axeTest = `test('the ${input.pascalName} scene has no axe violations', async () => {
	const { container } = render(<${sceneName} />);

	await expectNoAxeViolations(container);
});`;

	const placeholderTest = `// TODO: replace this placeholder with a test of ${input.pascalName}'s actual
// behaviour (what it renders, how it responds to interaction, what it exposes
// to assistive tech), or delete it if the tests above already cover it.
test('${input.pascalName} renders its content', () => {
	const { locator } = render(<${input.pascalName}>Content</${input.pascalName}>);

	expect(locator.getByText('Content').element()).toBeInTheDocument();
});`;

	const visualTest = input.visualCoverage
		? `

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<${sceneName} />, { appearance });
		await captureVisualAppearance(locator, '${input.name}/kitchen-sink', appearance);
	}
});`
		: '';

	return `// This scaffold assumes ${input.pascalName} needs axe and visual coverage by
// default. Delete either — or the placeholder behavioural test below — if it
// does not protect anything meaningful for this primitive.

${imports.join('\n')}

${scene}

${forwardingTest}

${axeTest}

${placeholderTest}${visualTest}
`;
}
