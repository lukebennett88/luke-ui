import type { ExportTier } from './discover-exports.js';
import type { ParsedBarrelExport, ParsedComponent } from './parse-types.js';

const RAC_DOCS_BASE = 'https://react-spectrum.adobe.com/react-aria';

export interface RenderComponentPageInput {
	slug: string;
	importPath: string;
	tier: ExportTier;
	parsed: ParsedComponent;
	/** Authored Markdown prose for the Usage section. Undefined for primitives. */
	proseMarkdown: string | undefined;
}

export function renderComponentPage(input: RenderComponentPageInput): string {
	const { slug, importPath, tier, parsed, proseMarkdown } = input;
	const lines: Array<string> = [];

	lines.push(`# ${slugToTitle(slug, tier)}`);
	lines.push('');
	if (parsed.description) {
		lines.push(`> ${parsed.description.replace(/\n/g, ' ')}`);
		lines.push('');
	}

	lines.push('## Import');
	lines.push('');
	lines.push('```ts');
	const importIdent = exportIdentifier(slug, tier);
	lines.push(`import { ${importIdent} } from '${importPath}';`);
	lines.push('```');
	lines.push('');

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

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Barrel page renderer
// ---------------------------------------------------------------------------

export interface RenderBarrelPageInput {
	slug: string;
	importPath: string;
	tier: ExportTier;
	description?: string;
	exports: Array<ParsedBarrelExport>;
}

export function renderBarrelPage(input: RenderBarrelPageInput): string {
	const { slug, importPath, tier, description, exports } = input;
	const lines: Array<string> = [];

	lines.push(`# ${slugToTitle(slug, tier)}`);
	lines.push('');

	if (description) {
		lines.push(`> ${description.replace(/\n/g, ' ')}`);
		lines.push('');
	}

	lines.push('## Import');
	lines.push('');
	lines.push('```ts');
	lines.push(`import { ${exports.map((e) => e.name).join(', ')} } from '${importPath}';`);
	lines.push('```');
	lines.push('');

	lines.push('## Exports');
	lines.push('');

	for (const e of exports) {
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

	return lines.join('\n');
}

function slugToTitle(slug: string, tier: ExportTier): string {
	const isPrimitive = slug.endsWith('-primitive');
	const base = (isPrimitive ? slug.slice(0, -'-primitive'.length) : slug)
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
	if (tier === 'primitive') return `${base} (primitive)`;
	return base;
}

function exportIdentifier(slug: string, tier: ExportTier): string {
	// Note: ignores `tier`. Identifier derivation is the same for all tiers.
	// (Multi-export primitives are handled in Task 6 with a different render path.)
	void tier;
	const stripped = slug.endsWith('-primitive') ? slug.slice(0, -'-primitive'.length) : slug;
	return stripped
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}
