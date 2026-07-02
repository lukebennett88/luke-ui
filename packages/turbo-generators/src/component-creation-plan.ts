export type ComponentTier = 'atom' | 'composed';
export type ComponentStyling = 'none' | 'recipe';

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

export interface ComponentCreationPlan {
	expected: {
		hostedDocsPath: string;
		packageDocsSlug: string;
		packageExportPath: string;
		storySlug: string;
	};
	files: Array<PlanFile>;
	jsonEdits: Array<JsonArrayAddSortedEdit>;
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
			contents: renderPackageDocs({ name, packagePath, pascalName }),
			path: `packages/@luke-ui/react/src/${name}/${name}.docs.md`,
		},
		{
			contents: renderPackageStory({ docsGroup, name, pascalName }),
			path: `packages/@luke-ui/react/src/${name}/${name}.stories.tsx`,
		},
		{
			contents: renderHostedStory({ name, pascalName }),
			path: `apps/docs/src/${name}/${name}.story.tsx`,
		},
		{
			contents: renderHostedStoryClient({ name, pascalName }),
			path: `apps/docs/src/${name}/${name}.story.client.tsx`,
		},
		{
			contents: renderHostedDocsPage({ displayName, name }),
			path: `apps/docs/content/docs/components/${docsGroup}/${name}.mdx`,
		},
	];

	if (input.styling === 'recipe') {
		files.push({
			contents: renderRecipe({ camelName, pascalName }),
			path: `packages/@luke-ui/react/src/recipes/${name}.css.ts`,
		});
	}

	return {
		expected: {
			hostedDocsPath: `components/${docsGroup}/${name}`,
			packageDocsSlug: name,
			packageExportPath: `./${name}`,
			storySlug: name,
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
import { cx } from '../utils/index.js';
${styleImport}
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

function renderPackageDocs(input: {
	name: string;
	packagePath: string;
	pascalName: string;
}): string {
	return `\`${input.pascalName}\` from \`${input.packagePath}\`.

## Usage

\`\`\`tsx
<${input.pascalName}>Label</${input.pascalName}>
\`\`\`
`;
}

function renderPackageStory(input: {
	docsGroup: string;
	name: string;
	pascalName: string;
}): string {
	return `import { ${input.pascalName} } from '@luke-ui/react/${input.name}';
import { expect } from 'storybook/test';
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
\tplay: async ({ canvas }) => {
\t\tawait expect(canvas.getByText('${input.pascalName}')).toBeInTheDocument();
\t},
});
`;
}

function renderHostedStory(input: { name: string; pascalName: string }): string {
	return `import type { ${input.pascalName} } from '@luke-ui/react/${input.name}';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof ${input.pascalName}>(import.meta.url, {
\tinitial: {
\t\tchildren: '${input.pascalName}',
\t},
\tpriorities: ['children'],
});
`;
}

function renderHostedStoryClient(input: { name: string; pascalName: string }): string {
	return `import { ${input.pascalName} } from '@luke-ui/react/${input.name}';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './${input.name}.story';

export const storyClient = createWrappedStoryClient<typeof story>(${input.pascalName});
`;
}

function renderHostedDocsPage(input: { displayName: string; name: string }): string {
	return `---
title: ${input.displayName}
description: ${input.displayName} component.
---

import { storyClient } from '../../../../src/${input.name}/${input.name}.story.client';

<storyClient.WithControl />

<include>../../../../../../packages/@luke-ui/react/docs/${input.name}.md</include>
`;
}

function renderRecipe(input: { camelName: string; pascalName: string }): string {
	return `import { recipeInLayer } from '../styles/layered-style.css.js';

export const ${input.camelName} = recipeInLayer('recipes', {
\tbase: {
\t\tdisplay: 'inline-flex',
\t},
});
`;
}
