import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PlopTypes } from '@turbo/gen';

const DOCS_GROUPS = ['actions', 'feedback', 'forms', 'typography', 'visuals'] as const;

const COMPONENT_NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;
const CAMEL_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;
const NON_ALPHANUM_RE = /[^A-Za-z0-9-]/g;
const TRAILING_WHITESPACE_RE = /\s+$/;
const TRAILING_NEWLINES_RE = /\n*$/;

type GeneratorAnswers = {
	group?: string;
	name?: string;
};

function validateComponentName(value: unknown): true | string {
	if (typeof value !== 'string') {
		return 'Component name is required.';
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return 'Component name is required.';
	}

	if (!COMPONENT_NAME_RE.test(trimmed)) {
		return 'Use letters/numbers/hyphens. Start with a letter.';
	}

	return true;
}

function toKebabCase(value: string): string {
	return value
		.trim()
		.replaceAll(CAMEL_BOUNDARY_RE, '$1-$2')
		.replaceAll(NON_ALPHANUM_RE, '-')
		.toLowerCase();
}

function toDisplayName(value: string): string {
	const kebab = toKebabCase(value);
	let result = '';
	let capitalize = true;

	for (let i = 0; i < kebab.length; i += 1) {
		const ch = kebab.charAt(i);
		if (ch === '-') {
			result += ' ';
			capitalize = true;
		} else {
			result += capitalize ? ch.toUpperCase() : ch;
			capitalize = false;
		}
	}

	return result;
}

function toCamelCase(value: string): string {
	const kebab = toKebabCase(value);
	let result = '';
	let capitalize = false;

	for (let i = 0; i < kebab.length; i += 1) {
		const ch = kebab.charAt(i);
		if (ch === '-') {
			capitalize = true;
		} else {
			result += capitalize ? ch.toUpperCase() : ch;
			capitalize = false;
		}
	}

	return result;
}

function resolveGroup(answers: GeneratorAnswers): string {
	const group = answers.group;
	if (typeof group !== 'string' || !group.trim()) {
		throw new Error('Missing required answer: group');
	}
	return toKebabCase(group);
}

function resolveComponentDir(answers: GeneratorAnswers): string {
	const name = answers.name;
	if (typeof name !== 'string' || !name.trim()) {
		throw new Error('Missing required answer: name');
	}

	return toKebabCase(name);
}

const DOCS_COMPONENTS_DIR = join(process.cwd(), 'apps/docs/content/docs/components');
const DOCS_CONTENT_DIR = join(process.cwd(), 'apps/docs/content/docs');
const DOCS_INDEX_PATH = join(DOCS_CONTENT_DIR, 'index.mdx');
const GETTING_STARTED_PATH = join(DOCS_CONTENT_DIR, 'getting-started.mdx');
const RECIPES_LAYERS_PATH = join(
	process.cwd(),
	'packages/@luke-ui/react/src/recipes/layers.css.ts',
);
const RECIPES_INDEX_PATH = join(process.cwd(), 'packages/@luke-ui/react/src/recipes/index.ts');

function addComponentToDocsMeta(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const groupDir = join(DOCS_COMPONENTS_DIR, group);
	const groupMetaPath = join(groupDir, 'meta.json');

	mkdirSync(groupDir, { recursive: true });

	let meta: { pages?: Array<string>; title?: string };
	if (existsSync(groupMetaPath)) {
		const content = readFileSync(groupMetaPath, 'utf8');
		meta = JSON.parse(content) as { pages?: Array<string>; title?: string };
	} else {
		meta = { title: toDisplayName(group), pages: [] };
	}

	const pages = Array.isArray(meta.pages) ? meta.pages : [];
	if (pages.includes(componentDir)) {
		return `Docs meta already contains ${componentDir}`;
	}

	pages.push(componentDir);
	pages.sort();
	meta.pages = pages;
	writeFileSync(groupMetaPath, `${JSON.stringify(meta, null, '\t')}\n`);

	const parentMetaPath = join(DOCS_CONTENT_DIR, 'meta.json');
	const parentContent = readFileSync(parentMetaPath, 'utf8');
	const parentMeta = JSON.parse(parentContent) as {
		pages?: Array<string>;
		title?: string;
	};
	const parentPages = Array.isArray(parentMeta.pages) ? parentMeta.pages : [];
	if (!parentPages.includes(group)) {
		parentPages.push(group);
		parentPages.sort();
		parentMeta.pages = parentPages;
		writeFileSync(parentMetaPath, `${JSON.stringify(parentMeta, null, '\t')}\n`);
	}

	return `Added ${componentDir} to docs components ${group} meta`;
}

function addComponentToDocsIndex(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const href = `/docs/components/${group}/${componentDir}`;
	const cardLine = `\t<Card title="${toDisplayName(componentDir)} component" href="${href}" />`;

	const content = readFileSync(DOCS_INDEX_PATH, 'utf8');
	if (content.includes(`href="${href}"`)) {
		return `Docs index already links ${componentDir}`;
	}

	const marker = '</Cards>';
	if (!content.includes(marker)) {
		throw new Error(`Could not find "${marker}" in ${DOCS_INDEX_PATH}`);
	}

	const updatedContent = content.replace(marker, `${cardLine}\n${marker}`);
	writeFileSync(DOCS_INDEX_PATH, updatedContent);
	return `Added docs index card for ${componentDir}`;
}

function addComponentToGettingStarted(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const displayName = toDisplayName(componentDir);
	const nextStepLine = `- Read the [${displayName}](/docs/components/${group}/${componentDir}) docs.`;

	const content = readFileSync(GETTING_STARTED_PATH, 'utf8');
	if (content.includes(nextStepLine)) {
		return `Getting Started already links ${componentDir}`;
	}

	const lines = content.split('\n');
	let nextStepsIndex = -1;
	for (let i = 0; i < lines.length; i += 1) {
		if (lines[i]?.trim() === '## Next Steps') {
			nextStepsIndex = i;
			break;
		}
	}

	if (nextStepsIndex === -1) {
		const appended = `${content.replace(TRAILING_WHITESPACE_RE, '')}\n\n## Next Steps\n\n${nextStepLine}\n`;
		writeFileSync(GETTING_STARTED_PATH, appended);
		return `Added Next Steps section with ${componentDir}`;
	}

	let insertAt = lines.length;
	for (let i = nextStepsIndex + 1; i < lines.length; i += 1) {
		const line = lines[i];
		if (line && line.charAt(0) === '#' && line.charAt(1) === '#' && line.charAt(2) === ' ') {
			insertAt = i;
			break;
		}
	}

	lines.splice(insertAt, 0, nextStepLine);
	writeFileSync(GETTING_STARTED_PATH, `${lines.join('\n').replace(TRAILING_NEWLINES_RE, '\n')}`);
	return `Added Getting Started next step for ${componentDir}`;
}

/** Append new component CSS import to recipes/layers.css.ts and sort. */
function addComponentToStylesIndex(answers: GeneratorAnswers): string {
	const componentDir = resolveComponentDir(answers);
	const newImport = `import './${componentDir}.css.js';`;
	const content = readFileSync(RECIPES_LAYERS_PATH, 'utf8');
	if (content.includes(newImport)) {
		return `Recipes layers already contains ${componentDir} CSS`;
	}

	const seen = new Set<string>();
	const imports: Array<string> = [];
	let start = 0;

	for (let i = 0; i <= content.length; i += 1) {
		if (i === content.length || content.charAt(i) === '\n') {
			const line = content.slice(start, i).trim();
			if (line && !seen.has(line)) {
				seen.add(line);
				imports.push(line);
			}
			start = i + 1;
		}
	}

	if (!seen.has(newImport)) {
		imports.push(newImport);
	}

	imports.sort((a, b) => a.localeCompare(b));
	writeFileSync(RECIPES_LAYERS_PATH, `${imports.join('\n')}\n`);
	return `Added ${componentDir} CSS to recipes layers`;
}

function addComponentToRecipesIndex(answers: GeneratorAnswers): string {
	const componentDir = resolveComponentDir(answers);
	const pascalName = toDisplayName(componentDir).replaceAll(' ', '');
	const camelName = toCamelCase(componentDir);

	const typeExport = `export type { ${pascalName}Variants } from './${componentDir}.css.js';`;
	const valueExport = `export { ${camelName} } from './${componentDir}.css.js';`;
	const content = readFileSync(RECIPES_INDEX_PATH, 'utf8');
	if (content.includes(typeExport)) {
		return `Recipes index already contains ${componentDir}`;
	}

	let firstExportIndex = -1;
	for (let i = 0; i < content.length - 6; i += 1) {
		if (
			content.charAt(i) === 'e' &&
			content.charAt(i + 1) === 'x' &&
			content.charAt(i + 2) === 'p' &&
			content.charAt(i + 3) === 'o' &&
			content.charAt(i + 4) === 'r' &&
			content.charAt(i + 5) === 't' &&
			content.charAt(i + 6) === ' '
		) {
			if (i === 0 || content.charAt(i - 1) === '\n') {
				firstExportIndex = i;
				break;
			}
		}
	}

	if (firstExportIndex === -1) {
		const separator = content.charAt(content.length - 1) === '\n' ? '' : '\n';
		writeFileSync(RECIPES_INDEX_PATH, `${content}${separator}${typeExport}\n${valueExport}\n`);
		return `Added ${componentDir} to recipes index`;
	}
	const newBlock = `${typeExport}\n${valueExport}\n`;
	const updated = `${content.slice(0, firstExportIndex)}${newBlock}${content.slice(firstExportIndex)}`;
	writeFileSync(RECIPES_INDEX_PATH, updated);
	return `Added ${componentDir} to recipes index`;
}

function syncTsdownExports(): string {
	execSync('pnpm --dir packages/@luke-ui/react run build:tsdown', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});
	return 'Synced tsdown exports and build outputs';
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setHelper('displayName', (value: unknown): string => {
		return typeof value === 'string' ? toDisplayName(value) : '';
	});

	plop.setGenerator('component', {
		description: 'Scaffold a new component in @luke-ui/react',
		prompts: [
			{
				type: 'list',
				name: 'group',
				message: 'Component group:',
				choices: [...DOCS_GROUPS],
			},
			{
				type: 'input',
				name: 'name',
				message: 'Component name (PascalCase or kebab-case):',
				validate: validateComponentName,
			},
		],
		actions: [
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase name}}/index.tsx',
				templateFile: 'templates/component/component.tsx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/recipes/{{kebabCase name}}.css.ts',
				templateFile: 'templates/component/component.recipe.css.ts.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase name}}.stories.tsx',
				templateFile: 'templates/component/component.stories.tsx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase name}}.docs.mdx',
				templateFile: 'templates/component/component.docs.mdx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/apps/docs/content/docs/components/{{kebabCase group}}/{{kebabCase name}}.mdx',
				templateFile: 'templates/component/component.docs-page.mdx.hbs',
			},
			addComponentToDocsMeta,
			addComponentToDocsIndex,
			addComponentToGettingStarted,
			addComponentToRecipesIndex,
			addComponentToStylesIndex,
			syncTsdownExports,
			() => {
				return 'Done. @luke-ui/react exports were refreshed via tsdown.';
			},
		],
	});
}
