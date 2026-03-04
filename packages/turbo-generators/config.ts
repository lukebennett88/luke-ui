import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PlopTypes } from '@turbo/gen';

const COMPONENT_GROUPS = ['actions', 'feedback', 'typography', 'visuals'] as const;

type GeneratorAnswers = {
	group?: string;
	includeComposed?: boolean;
	name?: string;
};

function validateComponentName(value: unknown): true | string {
	if (!value || typeof value !== 'string') {
		return 'Component name is required.';
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return 'Component name is required.';
	}

	if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(trimmed)) {
		return 'Use letters/numbers/hyphens. Start with a letter.';
	}

	return true;
}

function toKebabCase(value: string): string {
	return value
		.trim()
		.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replaceAll(/[^A-Za-z0-9-]/g, '-')
		.toLowerCase();
}

function toDisplayName(value: string): string {
	return toKebabCase(value)
		.split('-')
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase() + part.slice(1))
		.join(' ');
}

function toCamelCase(value: string): string {
	const parts = toKebabCase(value).split('-').filter(Boolean);
	if (parts.length === 0) {
		return '';
	}
	return parts
		.map((part, index) => {
			return index === 0 ? part : (part[0]?.toUpperCase() ?? '') + part.slice(1);
		})
		.join('');
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

function addComponentToDocsMeta(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const groupDir = join(process.cwd(), 'apps/docs/content/docs/components', group);
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

	meta.pages = [...pages, componentDir].sort();
	writeFileSync(groupMetaPath, `${JSON.stringify(meta, null, '\t')}\n`);

	const parentMetaPath = join(process.cwd(), 'apps/docs/content/docs/components/meta.json');
	const parentContent = readFileSync(parentMetaPath, 'utf8');
	const parentMeta = JSON.parse(parentContent) as {
		pages?: Array<string>;
		title?: string;
	};
	const parentPages = Array.isArray(parentMeta.pages) ? parentMeta.pages : [];
	if (!parentPages.includes(group)) {
		parentMeta.pages = [...parentPages, group].sort();
		writeFileSync(parentMetaPath, `${JSON.stringify(parentMeta, null, '\t')}\n`);
	}

	return `Added ${componentDir} to docs components ${group} meta`;
}

function addComponentToDocsIndex(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const filePath = join(process.cwd(), 'apps/docs/content/docs/index.mdx');
	const href = `/docs/components/${group}/${componentDir}`;
	const cardLine = `\t<Card title="${toDisplayName(componentDir)} component" href="${href}" />`;

	const content = readFileSync(filePath, 'utf8');
	if (content.includes(`href="${href}"`)) {
		return `Docs index already links ${componentDir}`;
	}

	const marker = '</Cards>';
	if (!content.includes(marker)) {
		throw new Error(`Could not find "${marker}" in ${filePath}`);
	}

	const updatedContent = content.replace(marker, `${cardLine}\n${marker}`);
	writeFileSync(filePath, updatedContent);
	return `Added docs index card for ${componentDir}`;
}

function addComponentToGettingStarted(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const filePath = join(process.cwd(), 'apps/docs/content/docs/getting-started.mdx');
	const displayName = toDisplayName(componentDir);
	const nextStepLine = `- Read the [${displayName}](/docs/components/${group}/${componentDir}) docs.`;

	const content = readFileSync(filePath, 'utf8');
	if (content.includes(nextStepLine)) {
		return `Getting Started already links ${componentDir}`;
	}

	const lines = content.split('\n');
	const nextStepsIndex = lines.findIndex((line) => line.trim() === '## Next Steps');

	if (nextStepsIndex === -1) {
		const appended = `${content.trimEnd()}\n\n## Next Steps\n\n${nextStepLine}\n`;
		writeFileSync(filePath, appended);
		return `Added Next Steps section with ${componentDir}`;
	}

	let insertAt = lines.length;
	for (let i = nextStepsIndex + 1; i < lines.length; i += 1) {
		if (lines[i]?.startsWith('## ')) {
			insertAt = i;
			break;
		}
	}

	lines.splice(insertAt, 0, nextStepLine);
	writeFileSync(filePath, `${lines.join('\n').replace(/\n*$/, '\n')}`);
	return `Added Getting Started next step for ${componentDir}`;
}

function addComponentToGroupBarrel(answers: GeneratorAnswers): string {
	const group = resolveGroup(answers);
	const componentDir = resolveComponentDir(answers);
	const pascalName = toDisplayName(componentDir).replaceAll(' ', '');
	const reactRoot = join(process.cwd(), 'packages/@luke-ui/react/src', group);

	const primitivesPath = join(reactRoot, 'primitives.ts');
	let primitives = readFileSync(primitivesPath, 'utf8');
	const primitiveExport = `export { ${pascalName}, type ${pascalName}Props } from './${componentDir}/primitives/${componentDir}.js';\n`;
	if (!primitives.includes(`from './${componentDir}/primitives/`)) {
		primitives = `${primitives.trimEnd()}\n${primitiveExport}`;
		writeFileSync(primitivesPath, primitives);
	}

	if (answers.includeComposed) {
		const composedPath = join(reactRoot, 'composed.ts');
		if (existsSync(composedPath)) {
			let composed = readFileSync(composedPath, 'utf8');
			const composedExport = `export type { ${pascalName}Props } from './${componentDir}/composed/${componentDir}.js';\nexport { ${pascalName} } from './${componentDir}/composed/${componentDir}.js';\n`;
			if (!composed.includes(`from './${componentDir}/composed/`)) {
				composed = `${composed.trimEnd()}\n${composedExport}`;
				writeFileSync(composedPath, composed);
			}
		}
	}

	return `Added ${componentDir} to ${group} barrel(s)`;
}

const STYLES_PRIMITIVES_PATH = join(
	process.cwd(),
	'packages/@luke-ui/react/src/styles/primitives.css.ts',
);
const RECIPES_PRIMITIVES_PATH = join(
	process.cwd(),
	'packages/@luke-ui/react/src/recipes/primitives.ts',
);

/** Append new component primitives CSS import to primitives.css.ts and sort. */
function addComponentToStylesIndex(answers: GeneratorAnswers): string {
	const componentDir = resolveComponentDir(answers);
	const newImport = `import '../recipes/${componentDir}.css.js';`;
	const content = readFileSync(STYLES_PRIMITIVES_PATH, 'utf8');
	if (content.includes(newImport)) {
		return `Styles primitives barrel already contains ${componentDir} CSS`;
	}
	const imports = Array.from(
		new Set(
			content
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean)
				.concat(newImport),
		),
	);
	imports.sort((a, b) => a.localeCompare(b));
	writeFileSync(STYLES_PRIMITIVES_PATH, `${imports.join('\n')}\n`);
	return `Added ${componentDir} CSS to styles primitives barrel`;
}

function addComponentToRecipesBarrel(answers: GeneratorAnswers): string {
	const componentDir = resolveComponentDir(answers);
	const pascalName = toDisplayName(componentDir).replaceAll(' ', '');
	const camelName = toCamelCase(componentDir);

	const exportLine = `export { ${camelName}, type ${pascalName}Variants } from './${componentDir}.css.js';`;
	const content = readFileSync(RECIPES_PRIMITIVES_PATH, 'utf8');
	if (content.includes(exportLine)) {
		return `Recipes barrel already contains ${componentDir}`;
	}
	const firstImportIndex = content.search(/^import\s/m);
	if (firstImportIndex === -1) {
		const separator = content.endsWith('\n') ? '' : '\n';
		writeFileSync(RECIPES_PRIMITIVES_PATH, `${content}${separator}${exportLine}\n`);
		return `Added ${componentDir} to recipes barrel`;
	}
	const updated = `${content.slice(0, firstImportIndex)}${exportLine}\n${content.slice(firstImportIndex)}`;
	writeFileSync(RECIPES_PRIMITIVES_PATH, updated);
	return `Added ${componentDir} to recipes barrel`;
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
				choices: [...COMPONENT_GROUPS],
			},
			{
				type: 'input',
				name: 'name',
				message: 'Component name (PascalCase or kebab-case):',
				validate: validateComponentName,
			},
			{
				type: 'confirm',
				name: 'includeComposed',
				message: 'Generate composed export module?',
				default: false,
			},
		],
		actions: [
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase group}}/{{kebabCase name}}/primitives/{{kebabCase name}}.tsx',
				templateFile: 'templates/component/component.tsx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/recipes/{{kebabCase name}}.css.ts',
				templateFile: 'templates/component/component.recipe.css.ts.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase group}}/{{kebabCase name}}/{{kebabCase name}}.stories.tsx',
				templateFile: 'templates/component/component.stories.tsx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase group}}/{{kebabCase name}}/{{kebabCase name}}.docs.mdx',
				templateFile: 'templates/component/component.docs.mdx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/apps/docs/content/docs/components/{{kebabCase group}}/{{kebabCase name}}.mdx',
				templateFile: 'templates/component/component.docs-page.mdx.hbs',
			},
			{
				type: 'add',
				path: '{{ turbo.paths.root }}/packages/@luke-ui/react/src/{{kebabCase group}}/{{kebabCase name}}/composed/{{kebabCase name}}.ts',
				templateFile: 'templates/component/component.composed.ts.hbs',
				skip: (answers: GeneratorAnswers) => {
					return answers.includeComposed === true
						? false
						: 'Skipping composed module: includeComposed=false';
				},
			},
			addComponentToDocsMeta,
			addComponentToDocsIndex,
			addComponentToGettingStarted,
			addComponentToGroupBarrel,
			addComponentToRecipesBarrel,
			addComponentToStylesIndex,
			syncTsdownExports,
			() => {
				return 'Done. @luke-ui/react exports were refreshed via tsdown.';
			},
		],
	});
}
