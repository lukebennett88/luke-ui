type ComponentTier = 'atom' | 'composed';
type ComponentStyling = 'none' | 'recipe';
type ConformanceTier = 'universal' | 'field-shaped' | 'none';

export interface CreateComponentInput {
	conformanceTier?: ConformanceTier;
	docsGroup: string;
	integrationTripwire?: boolean;
	name: string;
	styling: ComponentStyling;
	tier: ComponentTier;
	visualCoverage?: boolean;
}

export interface PlanFile {
	contents: string;
	path: string;
}

export interface JsonArrayAddSortedEdit {
	key: 'pages';
	kind: 'array-add-sorted';
	path: string;
	title: string;
	value: string;
}

export interface TextFileAppendEdit {
	kind: 'text-append';
	lines: Array<string>;
	path: string;
}

export interface TextFileInsertEdit {
	kind: 'text-insert';
	lines: Array<string>;
	marker: string;
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
	jsonEdits: Array<JsonArrayAddSortedEdit>;
	textFileAppends: Array<TextFileAppendEdit>;
	textFileInserts?: Array<TextFileInsertEdit>;
}

const COMPONENT_NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;
const CAMEL_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;
const NON_ALPHANUM_RE = /[^A-Za-z0-9-]/g;

export function createComponentPlan(input: CreateComponentInput): ComponentCreationPlan {
	const name = parseName(input.name);
	const docsGroup = parseDocsGroup(input.docsGroup);
	const displayName = toDisplayName(name);
	const pascalName = displayName.replaceAll(' ', '');
	const camelName = toCamelCase(name);
	const packagePath = `@luke-ui/react/${name}`;
	const conformanceTier = input.conformanceTier ?? 'universal';
	const integrationTripwire = input.integrationTripwire === true ? 'required' : 'none';
	const visualApplicability = input.visualCoverage === false ? 'none' : 'applicable';

	const files: Array<PlanFile> = [
		{
			contents: renderComponentSource({
				camelName,
				name,
				packagePath,
				pascalName,
				styling: input.styling,
				tier: input.tier,
			}),
			path: `packages/@luke-ui/react/src/${name}/index.tsx`,
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

	if (conformanceTier !== 'none' || integrationTripwire === 'required') {
		files.push({
			contents: renderComponentTestRegistration({
				conformanceTier,
				integrationTripwire,
				name,
			}),
			path: `packages/@luke-ui/react/src/${name}/component-test-registration.ts`,
		});
	}

	if (input.styling === 'recipe') {
		files.push({
			contents: renderRecipe({ camelName, pascalName }),
			path: `packages/@luke-ui/react/src/recipes/${name}.css.ts`,
		});
	}

	const recipeBarrelLines =
		input.styling === 'recipe'
			? [
					`export type { ${pascalName}Variants } from '../recipes/${name}.css.js';`,
					`export { ${camelName} } from '../recipes/${name}.css.js';`,
				]
			: [];

	if (input.visualCoverage !== false) {
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
		textFileAppends:
			recipeBarrelLines.length > 0
				? [
						{
							kind: 'text-append' as const,
							lines: recipeBarrelLines,
							path: 'packages/@luke-ui/react/src/recipes/index.ts',
						},
					]
				: [],
		textFileInserts: [
			{
				kind: 'text-insert',
				lines: [
					`\t['${pascalName}', '${name}', '${input.tier}', '${conformanceTier}', '${integrationTripwire}', '${visualApplicability}'],`,
				],
				marker:
					'].map(([name, path, tier, conformanceTier, integrationTripwire, visualApplicability]) => ({',
				path: 'packages/@luke-ui/react/src/conformance/manifest.ts',
			},
		],
	};
}

function parseName(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error('Component name required.');
	}
	if (!COMPONENT_NAME_RE.test(trimmed)) {
		throw new Error('Use letters/numbers/hyphens. Start with a letter.');
	}
	return toKebabCase(trimmed);
}

function parseDocsGroup(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error('Docs group required.');
	}
	return toKebabCase(trimmed);
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
	styling: ComponentStyling;
	tier: ComponentTier;
}): string {
	const cxImport = input.styling === 'recipe' ? "import { cx } from '../utils/index.js';\n" : '';
	const styleImport =
		input.styling === 'recipe'
			? `import * as styles from '../recipes/${input.name}.css.js';\n`
			: '';
	const propsExtends = ` extends ComponentProps<'div'>`;
	const className =
		input.styling === 'recipe'
			? ` className={cx(styles.${input.camelName}(), className)}`
			: ' className={className}';

	return `import type { ComponentProps, JSX } from 'react';
${cxImport}${styleImport}
/** Props for \`${input.pascalName}\`.
 *
 * @tier ${input.tier}
 */
export interface ${input.pascalName}Props${propsExtends} {}

/** ${input.pascalName} ${input.tier} component. */
export function ${input.pascalName}(props: ${input.pascalName}Props): JSX.Element {
\tconst { className, ...divProps } = props;
\treturn <div {...divProps}${className} />;
}
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
\tcomponent: ${input.pascalName},
\ttags: ['${input.docsGroup}'],
\ttitle: '${toDisplayName(input.docsGroup)}/${input.pascalName}',
});

export const Default = meta.story({
\targs: {
\t\tchildren: '${input.pascalName}',
\t},
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
		...(input.conformanceTier !== 'none' ? ["import type { ComponentProps } from 'react';"] : []),
		...(input.integrationTripwire === 'required'
			? ["import { expect } from 'vite-plus/test';"]
			: input.conformanceTier === 'none'
				? ["import { expect, test } from 'vite-plus/test';"]
				: []),
		...(helperImports.length > 0
			? [`import { ${helperImports.join(', ')} } from '../conformance/helpers.js';`]
			: []),
		"import { render } from '../test-utils/render.js';",
		...(input.conformanceTier !== 'none' || input.integrationTripwire === 'required'
			? ["import { componentTestRegistration } from './component-test-registration.js';"]
			: []),
		`import { ${input.pascalName} } from './index.js';`,
	];

	const renderComponent = `render(<${input.pascalName} {...(props}>Content</${input.pascalName}>)`;
	const contract =
		input.conformanceTier === 'universal'
			? `testUniversalConformance({
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected ${input.pascalName} element.');
		return target;
	},
	name: '${input.pascalName}',
	registration: componentTestRegistration,
	render: (props = {}) => ${renderComponent},
});`
			: input.conformanceTier === 'field-shaped'
				? `testFieldShapedConformance({
	getControl: (result) => {
		const control = result.container.querySelector('[name="conformance-field"]');
		if (!(control instanceof HTMLElement)) throw new Error('Expected a native field control.');
		return control;
	},
	name: '${input.pascalName}',
	registration: componentTestRegistration,
	render: (props = {}) => ${renderComponent},
});`
				: `test('${input.pascalName} renders its root element', () => {
	const result = render(<${input.pascalName}>Content</${input.pascalName}>);
	expect(result.locator.element().firstElementChild).toHaveTextContent('Content');
});`;

	const integration =
		input.integrationTripwire === 'required'
			? `
testIntegration(componentTestRegistration, '${input.pascalName}', async () => {
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

function renderComponentTestRegistration(input: {
	conformanceTier: ConformanceTier;
	integrationTripwire: 'none' | 'required';
	name: string;
}): string {
	return `import { defineComponentTestRegistration } from '../conformance/registrations.js';

export const componentTestRegistration = defineComponentTestRegistration({
	conformanceTier: '${input.conformanceTier}',
	integrationTripwire: '${input.integrationTripwire}',
	path: '${input.name}',
});
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
    path: packages/@luke-ui/react/src/${input.name}/index.tsx
---

<ExampleBlock
\tsrc="${input.name}/basic"
\ttitle="${input.displayName} — Basic"
/>
`;
}

function renderRecipe(input: { camelName: string; pascalName: string }): string {
	return `import { recipe } from './recipe.js';

export const ${input.camelName} = recipe({
\tbase: {
\t\tdisplay: 'inline-flex',
\t},
});
`;
}
