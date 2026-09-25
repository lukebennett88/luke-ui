import * as z from 'zod';
import { renderComponentPropsTable } from './creation-plan-docs.js';
import type { CreationWork, PlanFile } from './creation-plan-types.js';
import { toCamelCase, toDisplayName, toKebabCase, validateScaffoldName } from './naming.js';

/** Docs groups the component generator can place a guide in. */
export const DOC_GROUPS = [
	'actions',
	'feedback',
	'forms',
	'layout',
	'typography',
	'visuals',
] as const;

export const COMPONENT_DEFAULTS = {
	visualCoverage: true,
} as const;

export interface ComponentCreationPlan {
	expected: {
		hostedDocsPath: string;
		packageDocsSlug: string;
		packageExportPath: string;
		exampleSlug: string;
	};
	files: Array<PlanFile>;
}

interface ComponentCreationWork extends ComponentCreationPlan, CreationWork {}

const componentAnswersSchema = z.object({
	docsGroup: z.enum(DOC_GROUPS),
	name: z.string(),
	visualCoverage: z.boolean().default(COMPONENT_DEFAULTS.visualCoverage),
});

export type CreateComponentInput = z.input<typeof componentAnswersSchema>;
type ParsedComponentAnswers = z.output<typeof componentAnswersSchema>;

export function validateComponentName(value: unknown): true | string {
	return validateScaffoldName(value, 'component');
}

export function parseComponentAnswers(answers: unknown): ParsedComponentAnswers {
	const parsed = componentAnswersSchema.parse(answers);
	const nameCheck = validateComponentName(parsed.name);
	if (nameCheck !== true) {
		throw new Error(nameCheck);
	}
	return parsed;
}

export function createComponentPlan(answers: CreateComponentInput): ComponentCreationPlan {
	const { expected, files } = createComponentWork(parseComponentAnswers(answers));
	return { expected, files };
}

export function createComponentWork(input: ParsedComponentAnswers): ComponentCreationWork {
	const name = toKebabCase(input.name);
	const docsGroup = input.docsGroup;
	const displayName = toDisplayName(name);
	const pascalName = displayName.replaceAll(' ', '');
	const camelName = toCamelCase(name);
	const recipeName = `${camelName}Recipe`;
	const variantsType = `${pascalName}RecipeVariants`;
	const packagePath = `@luke-ui/react/${name}`;

	const files: Array<PlanFile> = [
		{
			contents: renderComponentSource({
				camelName,
				name,
				packagePath,
				pascalName,
				recipeName,
				variantsType,
			}),
			path: `packages/@luke-ui/react/src/core/${name}/${name}.tsx`,
		},
		{
			contents: renderPackageExport({ name, pascalName, recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/exports/${name}.ts`,
		},
		{
			contents: renderRecipe({ recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/core/${name}/recipe.css.ts`,
		},
		{
			contents: renderComponentTest({
				name,
				packagePath,
				pascalName,
				visualCoverage: input.visualCoverage,
			}),
			path: `packages/@luke-ui/react/src/core/${name}/${name}.browser.test.tsx`,
		},
		{
			contents: renderHostedExample({ name, pascalName }),
			path: `apps/docs/src/examples/${name}/basic.tsx`,
		},
		{
			contents: renderHostedDocsPage({ displayName, name, pascalName }),
			path: `apps/docs/content/docs/components/${docsGroup}/${name}.mdx`,
		},
	];

	return {
		expected: {
			exampleSlug: `${name}/basic`,
			hostedDocsPath: `components/${docsGroup}/${name}`,
			packageDocsSlug: name,
			packageExportPath: `./${name}`,
		},
		files,
		importEdits: [
			{
				kind: 'import',
				line: `import '../${name}/recipe.css.js';`,
				path: 'packages/@luke-ui/react/src/core/styles/modules.css.ts',
			},
		],
		jsonEdits: [
			{
				key: 'pages',
				kind: 'array-add-sorted',
				path: 'apps/docs/content/docs/components/meta.json',
				title: toDisplayName(docsGroup),
				value: docsGroup,
			},
			{
				key: 'pages',
				kind: 'array-add-sorted',
				path: `apps/docs/content/docs/components/${docsGroup}/meta.json`,
				title: toDisplayName(docsGroup),
				value: name,
			},
		],
		textFileInserts: [],
	};
}

function renderComponentSource(input: {
	camelName: string;
	name: string;
	packagePath: string;
	pascalName: string;
	recipeName: string;
	variantsType: string;
}): string {
	return `import type { ComponentProps, JSX } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { ${input.recipeName} } from './recipe.css.js';

export interface ${input.pascalName}Props extends ComponentProps<'div'> {}

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
	return `export { ${input.pascalName}, type ${input.pascalName}Props } from '../core/${input.name}/${input.name}.js';
export { type ${input.variantsType}, ${input.recipeName} } from '../core/${input.name}/recipe.css.js';
`;
}

function renderHostedExample(input: { name: string; pascalName: string }): string {
	return `import { ${input.pascalName} } from '@luke-ui/react/${input.name}';

export default function Basic() {
	return <${input.pascalName}>${input.pascalName}</${input.pascalName}>;
}
`;
}

function renderComponentTest(input: {
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
		"import { expectNoAxeViolations } from '../test-utils/axe.js';",
		"import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';",
		...(input.visualCoverage
			? ["import { render, visualAppearances } from '../test-utils/render.js';"]
			: ["import { render } from '../test-utils/render.js';"]),
		...(input.visualCoverage
			? ["import { captureVisualAppearance, Grid } from '../test-utils/visual.js';"]
			: ["import { Grid } from '../test-utils/visual.js';"]),
	];

	const scene = `function ${sceneName}() {
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

	const placeholderTest = `// TODO: Test actual behaviour or delete.
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

	return `${imports.join('\n')}

${scene}

${forwardingTest}

${axeTest}

${placeholderTest}${visualTest}
`;
}

function renderHostedDocsPage(input: {
	displayName: string;
	name: string;
	pascalName: string;
}): string {
	const propsPath = `packages/@luke-ui/react/src/core/${input.name}/${input.name}.tsx`;
	const propsTable = renderComponentPropsTable({
		name: `${input.pascalName}Props`,
		path: propsPath,
	});

	return `---
title: ${input.displayName}
source: packages/@luke-ui/react/src/exports/${input.name}.ts
---

<ExampleBlock
	src="${input.name}/basic"
	title="${input.displayName}: Basic"
/>

## API

${propsTable}
`;
}

function renderRecipe(input: { recipeName: string; variantsType: string }): string {
	return `import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

export const ${input.recipeName} = recipe({
	base: {
		display: 'inline-flex',
	},
});

export type ${input.variantsType} = RecipeSelection<typeof ${input.recipeName}>;
`;
}
