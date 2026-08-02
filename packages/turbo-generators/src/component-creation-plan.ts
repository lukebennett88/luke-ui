type ComponentTier = 'atom' | 'composed';
type ComponentStyling = 'none' | 'recipe';

export interface CreateComponentInput {
	docsGroup: string;
	name: string;
	styling: ComponentStyling;
	tier: ComponentTier;
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
			contents: renderPackageStory({ docsGroup, name, pascalName }),
			path: `packages/@luke-ui/react/src/${name}/${name}.stories.tsx`,
		},
		{
			contents: renderHostedExample({ name, pascalName }),
			path: `apps/docs/src/examples/${name}/basic.tsx`,
		},
		{
			contents: renderHostedDocsPage({ displayName, name }),
			path: `apps/docs/content/docs/components/${docsGroup}/${name}/index.mdx`,
		},
		{
			contents: renderHostedPropsPage({ displayName, name, pascalName }),
			path: `apps/docs/content/docs/components/${docsGroup}/${name}/props.mdx`,
		},
		{
			contents: '{\n\t"pages": ["!props"],\n\t"collapsible": false\n}\n',
			path: `apps/docs/content/docs/components/${docsGroup}/${name}/meta.json`,
		},
	];

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

	return {
		expected: {
			hostedDocsPath: `components/${docsGroup}/${name}`,
			packageDocsSlug: name,
			packageExportPath: `./${name}`,
			exampleSlug: `${name}/basic`,
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
\treturn <${input.pascalName}>${input.pascalName}</${input.pascalName}>;
}
`;
}

function renderHostedDocsPage(input: { displayName: string; name: string }): string {
	return `---
title: ${input.displayName}
---

<ExampleBlock
\tsrc="${input.name}/basic"
\ttitle="${input.displayName} — Basic"
/>
`;
}

function renderHostedPropsPage(input: {
	displayName: string;
	name: string;
	pascalName: string;
}): string {
	return `---
title: ${input.displayName}
---

## Props

<auto-type-table path="packages/@luke-ui/react/src/${input.name}/index.tsx" name="${input.pascalName}Props" />
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
