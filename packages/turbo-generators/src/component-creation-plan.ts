import * as z from 'zod';

export const CONFORMANCE_TIERS = ['universal', 'field-shaped', 'none'] as const;
export const DOC_GROUPS = ['actions', 'feedback', 'forms', 'typography', 'visuals'] as const;

export const COMPONENT_DEFAULTS = {
	conformanceTier: 'universal',
	integrationTripwire: false,
	visualCoverage: true,
} as const;

export type ConformanceTier = (typeof CONFORMANCE_TIERS)[number];

export interface PlanFile {
	contents: string;
	path: string;
}

export interface ComponentCreationPlan {
	expected: {
		hostedDocsPath: string;
		packageDocsSlug: string;
		packageExportPath: string;
		exampleSlug: string;
	};
	files: Array<PlanFile>;
}

interface JsonArrayAddSortedEdit {
	key: 'pages';
	kind: 'array-add-sorted';
	path: string;
	title: string;
	value: string;
}

interface TextFileInsertEdit {
	kind: 'text-insert';
	lines: Array<string>;
	marker: string;
	path: string;
}

interface SortedImportEdit {
	kind: 'sorted-import';
	line: string;
	path: string;
}

interface ComponentCreationWork extends ComponentCreationPlan {
	jsonEdits: Array<JsonArrayAddSortedEdit>;
	sortedImportEdits: Array<SortedImportEdit>;
	textFileInserts: Array<TextFileInsertEdit>;
}

const COMPONENT_NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;
const CAMEL_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;
const NON_ALPHANUM_RE = /[^A-Za-z0-9-]/g;

const componentAnswersSchema = z.object({
	conformanceTier: z.enum(CONFORMANCE_TIERS).default(COMPONENT_DEFAULTS.conformanceTier),
	docsGroup: z.enum(DOC_GROUPS),
	integrationTripwire: z.boolean().default(COMPONENT_DEFAULTS.integrationTripwire),
	name: z.string(),
	visualCoverage: z.boolean().default(COMPONENT_DEFAULTS.visualCoverage),
});

export type CreateComponentInput = z.input<typeof componentAnswersSchema>;
type ParsedComponentAnswers = z.output<typeof componentAnswersSchema>;

export function validateComponentName(value: unknown): true | string {
	if (typeof value !== 'string') {
		return 'Component name required.';
	}
	const trimmed = value.trim();
	if (!trimmed) {
		return 'Component name required.';
	}
	if (!COMPONENT_NAME_RE.test(trimmed)) {
		return 'Use letters/numbers/hyphens. Start with a letter.';
	}
	return true;
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
	const conformanceTier = input.conformanceTier;
	const integrationTripwire = input.integrationTripwire ? 'required' : 'none';
	const visualApplicability = input.visualCoverage ? 'applicable' : 'none';

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
			path: `packages/@luke-ui/react/src/${name}/${name}.tsx`,
		},
		{
			contents: renderComponentBarrel({ name, pascalName, recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/${name}/index.ts`,
		},
		{
			contents: renderRecipe({ recipeName, variantsType }),
			path: `packages/@luke-ui/react/src/${name}/recipe.css.ts`,
		},
		{
			contents: renderComponentTest({
				conformanceTier,
				integrationTripwire,
				name,
				pascalName,
			}),
			path: `packages/@luke-ui/react/src/${name}/${name}.browser.test.tsx`,
		},
		{
			contents: renderPackageStory({ docsGroup, name, pascalName }),
			path: `packages/@luke-ui/react/src/${name}/${name}.stories.tsx`,
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

	if (input.visualCoverage) {
		files.push({
			contents: renderVisualTest({ name, pascalName }),
			path: `packages/@luke-ui/react/src/${name}/${name}.visual.test.tsx`,
		});
	}

	return {
		expected: {
			exampleSlug: `${name}/basic`,
			hostedDocsPath: `components/${docsGroup}/${name}`,
			packageDocsSlug: name,
			packageExportPath: `./${name}`,
		},
		files,
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
		sortedImportEdits: [
			{
				kind: 'sorted-import',
				line: `import '../${name}/recipe.css.js';`,
				path: 'packages/@luke-ui/react/src/styles/modules.css.ts',
			},
		],
		textFileInserts: [
			{
				kind: 'text-insert',
				lines: [
					`\t['${pascalName}', '${name}', '${conformanceTier}', '${integrationTripwire}', '${visualApplicability}'],`,
				],
				marker:
					'].map(([name, path, conformanceTier, integrationTripwire, visualApplicability]) => ({',
				path: 'packages/@luke-ui/react/src/conformance/manifest.ts',
			},
		],
	};
}

function toKebabCase(value: string): string {
	return value
		.trim()
		.replaceAll(CAMEL_BOUNDARY_RE, '$1-$2')
		.replaceAll(NON_ALPHANUM_RE, '-')
		.toLowerCase();
}

function toDisplayName(value: string): string {
	return toKebabCase(value)
		.split('-')
		.filter(Boolean)
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(' ');
}

function toCamelCase(value: string): string {
	const [first = '', ...rest] = toKebabCase(value).split('-').filter(Boolean);
	return `${first}${rest.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('')}`;
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
import { cx } from '../utils/utils.js';
import { ${input.recipeName} } from './recipe.css.js';

/** Props for \`${input.pascalName}\`. */
export interface ${input.pascalName}Props extends ComponentProps<'div'> {}

/** ${input.pascalName} component. */
export function ${input.pascalName}(props: ${input.pascalName}Props): JSX.Element {
	const { className, ...divProps } = props;
	return <div {...divProps} className={cx(${input.recipeName}(), className)} />;
}
`;
}

function renderComponentBarrel(input: {
	name: string;
	pascalName: string;
	recipeName: string;
	variantsType: string;
}): string {
	return `export { ${input.pascalName}, type ${input.pascalName}Props } from './${input.name}.js';
export { ${input.recipeName}, type ${input.variantsType} } from './recipe.css.js';
`;
}

function renderPackageStory(input: {
	docsGroup: string;
	name: string;
	pascalName: string;
}): string {
	return `import { ${input.pascalName} } from '@luke-ui/react/${input.name}';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: ${input.pascalName},
	tags: ['${input.docsGroup}'],
	title: '${toDisplayName(input.docsGroup)}/${input.pascalName}',
});

export const Default = meta.story({
	args: {
		children: '${input.pascalName}',
	},
});
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
	conformanceTier: ConformanceTier;
	integrationTripwire: 'none' | 'required';
	name: string;
	pascalName: string;
}): string {
	const conformanceHelper =
		input.conformanceTier === 'universal'
			? 'testUniversalConformance'
			: input.conformanceTier === 'field-shaped'
				? 'testFieldShapedConformance'
				: undefined;
	const helperImports = [
		conformanceHelper,
		input.integrationTripwire === 'required' ? 'testIntegration' : undefined,
	].filter((value): value is string => value != null);
	const imports = [
		...(input.integrationTripwire === 'required'
			? ["import { expect } from 'vite-plus/test';"]
			: input.conformanceTier === 'none'
				? ["import { expect, test } from 'vite-plus/test';"]
				: []),
		...(helperImports.length > 0
			? [`import { ${helperImports.join(', ')} } from '../conformance/helpers.js';`]
			: []),
		"import { render } from '../test-utils/render.js';",
		`import { ${input.pascalName} } from './index.js';`,
	];

	const renderComponent = `render(<${input.pascalName} {...props}>Content</${input.pascalName}>)`;
	const contract =
		input.conformanceTier === 'universal'
			? `testUniversalConformance({
	path: '${input.name}',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected ${input.pascalName} element.');
		return target;
	},
	render: (props = {}) => ${renderComponent},
});`
			: input.conformanceTier === 'field-shaped'
				? `testFieldShapedConformance({
	path: '${input.name}',
	getControl: (result) => {
		const control = result.container.querySelector('[name="conformance-field"]');
		if (!(control instanceof HTMLElement)) throw new Error('Expected a native field control.');
		return control;
	},
	render: (props = {}) => ${renderComponent},
});`
				: `test('${input.pascalName} renders its root element', () => {
	const result = render(<${input.pascalName}>Content</${input.pascalName}>);
	expect(result.locator.element().firstElementChild).toHaveTextContent('Content');
});`;

	const integration =
		input.integrationTripwire === 'required'
			? `
testIntegration('${input.name}', async () => {
	let clicked = false;
	const { locator, user } = render(
		<${input.pascalName} onClick={() => (clicked = true)}>Content</${input.pascalName}>,
	);

	await user.click(locator.getByText('Content'));
	expect(clicked).toBe(true);
});`
			: '';

	return `${imports.join('\n')}

${contract}${integration}
`;
}

function renderVisualTest(input: { name: string; pascalName: string }): string {
	return `import { test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { captureVisual, Grid } from '../test-utils/visual.js';
import { ${input.pascalName} } from './index.js';

test('kitchen sink', async () => {
	const { locator } = render(
		<Grid columns={2}>
			<${input.pascalName}>Default</${input.pascalName}>
			<${input.pascalName}>With content</${input.pascalName}>
		</Grid>,
	);

	await captureVisual(locator, '${input.name}/kitchen-sink');
});
`;
}

function renderHostedDocsPage(input: {
	displayName: string;
	name: string;
	pascalName: string;
}): string {
	return `---
title: ${input.displayName}
source: packages/@luke-ui/react/src/${input.name}
props:
  - name: ${input.pascalName}Props
    path: packages/@luke-ui/react/src/${input.name}/${input.name}.tsx
---

<ExampleBlock
	src="${input.name}/basic"
	title="${input.displayName} — Basic"
/>
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
