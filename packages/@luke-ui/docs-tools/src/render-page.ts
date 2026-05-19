import type { ExportTier } from './discover-exports.js';
import type { ParsedBarrelExport, ParsedComponent } from './parse-types.js';
import { slugToTitle } from './title.js';

const RAC_DOCS_BASE = 'https://react-spectrum.adobe.com/react-aria';

interface RenderComponentPageInput {
	kind: 'component';
	slug: string;
	importPath: string;
	tier: ExportTier;
	parsed: ParsedComponent;
	/** Authored Markdown prose for the Usage section. Undefined for primitives. */
	proseMarkdown: string | undefined;
}

interface RenderBarrelPageInput {
	kind: 'barrel';
	slug: string;
	importPath: string;
	tier: ExportTier;
	description?: string;
	exports: Array<ParsedBarrelExport>;
}

export type RenderPageInput = RenderComponentPageInput | RenderBarrelPageInput;

export function renderPage(input: RenderPageInput): string {
	const lines = renderHeader(input);
	if (input.kind === 'component') {
		renderComponentBody(lines, input);
	} else {
		renderBarrelBody(lines, input);
	}
	return lines.join('\n');
}

function renderHeader(input: RenderPageInput): Array<string> {
	const lines: Array<string> = [];
	const description = input.kind === 'component' ? input.parsed.description : input.description;

	lines.push(`# ${slugToTitle(input.slug, input.tier)}`);
	lines.push('');
	if (description) {
		lines.push(`> ${description.replace(/\n/g, ' ')}`);
		lines.push('');
	}

	lines.push('## Import');
	lines.push('');
	lines.push('```ts');
	lines.push(importStatement(input));
	lines.push('```');
	lines.push('');

	return lines;
}

function importStatement(input: RenderPageInput): string {
	if (input.kind === 'barrel') {
		const importNames = input.exports.map((e) =>
			e.type?.startsWith('type ') ? `type ${e.name}` : e.name,
		);
		return `import { ${importNames.join(', ')} } from '${input.importPath}';`;
	}

	const importIdent = input.parsed.componentName ?? exportIdentifier(input.slug);
	return `import { ${importIdent} } from '${input.importPath}';`;
}

function renderComponentBody(lines: Array<string>, input: RenderComponentPageInput): void {
	const { tier, parsed, proseMarkdown } = input;

	if (tier !== 'primitive' && proseMarkdown) {
		lines.push('## Usage');
		lines.push('');
		lines.push(proseMarkdown.trim());
		lines.push('');
	}

	if (parsed.propsInterface) {
		lines.push('## Props');
		lines.push('');
		const externalExtends = parsed.propsInterface.extends.find((e) => e.from === 'external');
		if (externalExtends?.module === 'react-aria-components') {
			const componentName = externalExtends.typeName.replace(/Props$/, '');
			lines.push(
				`Extends [\`react-aria-components\` \`${externalExtends.typeName}\`](${RAC_DOCS_BASE}/${componentName}.html).`,
			);
			lines.push('');
		}
		lines.push('| Prop | Type | Default | Description |');
		lines.push('| --- | --- | --- | --- |');
		for (const prop of parsed.propsInterface.members) {
			const type = prop.type.replace(/\|/g, '\\|');
			const def = prop.default ? `\`${prop.default}\`` : '—';
			lines.push(
				`| \`${prop.name}\` | \`${type}\` | ${def} | ${prop.description.replace(/\n/g, ' ')} |`,
			);
		}
		lines.push('');
	}
}

function renderBarrelBody(lines: Array<string>, input: RenderBarrelPageInput): void {
	lines.push('## Exports');
	lines.push('');

	for (const e of input.exports) {
		lines.push(`### \`${e.name}\``);
		lines.push('');
		if (e.type) {
			lines.push('```ts');
			lines.push(e.type);
			lines.push('```');
			lines.push('');
		}
		if (e.description) {
			lines.push(e.description);
			lines.push('');
		}
	}
}

function exportIdentifier(slug: string): string {
	const stripped = slug.endsWith('-primitive') ? slug.slice(0, -'-primitive'.length) : slug;
	return stripped
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}
