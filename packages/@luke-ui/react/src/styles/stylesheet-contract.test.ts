import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const retainedLayerNames = ['reset', 'theme', 'recipes', 'utilities'] as const;
const retainedLayerNameSet = new Set<string>(retainedLayerNames);
const retainedTextSizes = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

test('builds the public stylesheet with the reset and theme layers', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url), 'utf8');
	const recipes = await import('@luke-ui/react/recipes');
	const styles = await import('@luke-ui/react/styles');
	const recipeClasses = recipes.icon().split(' ');
	const textClasses = new Set(
		retainedTextSizes.flatMap((size) => recipes.text({ size }).split(' ')),
	);
	const utilityClasses = styles.createSprinkles({ display: 'grid' }).className?.split(' ') ?? [];
	const layerBlocks = getLayerBlocks(stylesheet);

	expect(stylesheet).toMatch(/^@layer reset;\n@layer theme;\n@layer recipes;\n@layer utilities;/);
	expect(getLayerNames(stylesheet)).toEqual(retainedLayerNames);
	expect(getNestedLayerNames(stylesheet)).toEqual([]);
	// The VE Capsize adapter emits existing Text trim assets at the top level.
	expect(getUnexpectedTopLevelQualifiedRules(stylesheet, textClasses)).toEqual([]);
	expect(getTopLevelAtRules(stylesheet)).toEqual(['@keyframes']);

	const reset = getLayerBlock(layerBlocks, 'reset');
	expect(reset).toContain('.luke-ui-reset');
	expect(reset).toContain('box-sizing: border-box;');

	const theme = getLayerBlock(layerBlocks, 'theme');
	expect(theme).toContain('.luke-ui-theme');
	expect(theme).toContain('color: var(--luke-color-text-primary);');
	expect(theme).toContain('font-family: var(--luke-font-family);');

	const recipeStyles = getLayerBlock(layerBlocks, 'recipes');
	const utilityStyles = getLayerBlock(layerBlocks, 'utilities');
	const layers = new Map([
		['recipes', recipeStyles],
		['reset', reset],
		['theme', theme],
		['utilities', utilityStyles],
	]);

	for (const className of recipeClasses) {
		expect(layers.get('recipes')).toContain(`.${className}`);
		for (const layer of ['reset', 'theme', 'utilities']) {
			expect(layers.get(layer)).not.toContain(`.${className}`);
		}
	}

	for (const className of utilityClasses) {
		expect(layers.get('utilities')).toContain(`.${className}`);
		for (const layer of ['reset', 'theme', 'recipes']) {
			expect(layers.get(layer)).not.toContain(`.${className}`);
		}
	}

	expect([
		...new Set([...stylesheet.matchAll(/\.luke-ui-[\w-]+/g)].map((match) => match[0])),
	]).toEqual(['.luke-ui-reset', '.luke-ui-theme']);
});

test.each([
	['anonymous statement', '@layer;'],
	['anonymous block', '@layer {}'],
	['unknown statement', '@layer components;'],
	['unknown block', '@layer components {}'],
])('rejects an %s', (_name, layerRule) => {
	expect(() => getLayerNames(layerRule)).toThrow(/cascade layer/i);
});

test('rejects an ordinary Text recipe rule at the top level', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url), 'utf8');
	const { text } = await import('@luke-ui/react/recipes');
	const textClasses = new Set(retainedTextSizes.flatMap((size) => text({ size }).split(' ')));
	const recipeStyles = getLayerBlock(getLayerBlocks(stylesheet), 'recipes');
	const ordinaryTextClass = [...textClasses].find((className) =>
		recipeStyles.includes(`.${className} {`),
	);
	if (!ordinaryTextClass) throw new Error('Expected an ordinary Text recipe class.');

	const selector = `.${ordinaryTextClass}`;
	const mutatedStylesheet = `${stylesheet}\n${selector} { color: red; }`;
	expect(getUnexpectedTopLevelQualifiedRules(mutatedStylesheet, textClasses)).toEqual([selector]);
});

function getLayerNames(stylesheet: string): Array<string> {
	return [
		...new Set(
			[...stylesheet.matchAll(/@layer(?:\s+([^;{]*))?[;{]/g)].flatMap(getNamesFromLayerMatch),
		),
	];
}

function getNestedLayerNames(stylesheet: string): Array<string> {
	return [...stylesheet.matchAll(/@layer(?:\s+([^;{]*))?[;{]/g)]
		.filter((match) => getBraceDepth(stylesheet, match.index) > 0)
		.flatMap(getNamesFromLayerMatch);
}

function getLayerBlocks(stylesheet: string): Map<string, Array<string>> {
	const blocks = new Map<string, Array<string>>();

	for (const match of stylesheet.matchAll(/@layer(?:\s+([^;{]*))?\{/g)) {
		const start = match.index + match[0].length;
		const names = getNamesFromLayerMatch(match);
		if (names.length !== 1) throw new Error('Expected one layer name per layer block.');

		const name = names[0];
		if (!name) throw new Error('Expected a cascade layer name.');

		const contents = stylesheet.slice(start, getBlockEnd(stylesheet, start));
		blocks.set(name, [...(blocks.get(name) ?? []), contents]);
	}

	return blocks;
}

function getLayerBlock(layerBlocks: Map<string, Array<string>>, name: string): string {
	const blocks = layerBlocks.get(name);
	if (!blocks) throw new Error(`Expected ${name} layer block.`);

	return blocks.join('\n');
}

function getNamesFromLayerMatch(match: RegExpExecArray): Array<string> {
	const layerList = match[1]?.trim();
	if (!layerList) throw new Error('Anonymous cascade layers are not allowed.');

	const names = layerList.split(',').map((name) => name.trim());
	for (const name of names) {
		if (!retainedLayerNameSet.has(name)) throw new Error(`Unexpected cascade layer: ${name}`);
	}

	return names;
}

function getBlockEnd(stylesheet: string, start: number): number {
	let depth = 0;

	for (let index = start; index < stylesheet.length; index += 1) {
		if (stylesheet.startsWith('/*', index)) {
			index = getCommentEnd(stylesheet, index);
			continue;
		}

		if (stylesheet[index] === '"' || stylesheet[index] === "'") {
			index = getStringEnd(stylesheet, index);
			continue;
		}

		if (stylesheet[index] === '{') depth += 1;
		if (stylesheet[index] === '}') {
			if (depth === 0) return index;
			depth -= 1;
		}
	}

	throw new Error('Expected a matching closing brace.');
}

function getTopLevelAtRules(stylesheet: string): Array<string> {
	return [
		...new Set(
			getTopLevelNodes(stylesheet)
				.filter((node) => node.type === 'at-rule')
				.map((node) => node.name),
		),
	];
}

function getTopLevelQualifiedRules(stylesheet: string): Array<QualifiedRule> {
	const rules: Array<QualifiedRule> = [];

	for (const node of getTopLevelNodes(stylesheet)) {
		if (node.type !== 'qualified-rule') continue;

		rules.push({ declarations: node.declarations, selector: node.name });
	}

	return rules;
}

function getUnexpectedTopLevelQualifiedRules(
	stylesheet: string,
	textClasses: ReadonlySet<string>,
): Array<string> {
	const unexpectedSelectors: Array<string> = [];

	for (const rule of getTopLevelQualifiedRules(stylesheet)) {
		const classNames = getClassNames(rule.selector);
		const hasUnexpectedClass = classNames.some((className) => !textClasses.has(className));
		if (classNames.length > 0 && !hasUnexpectedClass && isTextTrimAsset(rule)) continue;

		unexpectedSelectors.push(rule.selector);
	}

	return unexpectedSelectors;
}

function isTextTrimAsset({ declarations: source, selector }: QualifiedRule): boolean {
	if (!/^\.[_a-zA-Z][\w-]*(?:::(?:before|after))?$/.test(selector)) return false;

	const declarations = getDeclarations(source);
	if (!declarations) return false;

	if (selector.endsWith('::before')) {
		return hasDeclarations(declarations, {
			content: "''",
			display: 'table',
			'margin-bottom': isCustomPropertyReference,
		});
	}

	if (selector.endsWith('::after')) {
		return hasDeclarations(declarations, {
			content: "''",
			display: 'table',
			'margin-top': isCustomPropertyReference,
		});
	}

	if (
		hasDeclarations(declarations, {
			'font-size': isCustomPropertyReference,
			'line-height': isCustomPropertyReference,
		})
	) {
		return true;
	}

	return isTextTrimSizeDeclarations(declarations);
}

function getDeclarations(source: string): Map<string, string> | undefined {
	const declarations = new Map<string, string>();

	for (const candidate of source.split(';')) {
		const declaration = candidate.trim();
		if (!declaration) continue;

		const separator = declaration.indexOf(':');
		if (separator < 1) return undefined;

		const name = declaration.slice(0, separator).trim();
		const value = declaration.slice(separator + 1).trim();
		if (!value || declarations.has(name)) return undefined;

		declarations.set(name, value);
	}

	return declarations;
}

function hasDeclarations(
	declarations: ReadonlyMap<string, string>,
	expected: Record<string, string | ((value: string) => boolean)>,
): boolean {
	const entries = Object.entries(expected);
	if (declarations.size !== entries.length) return false;

	for (const [name, expectedValue] of entries) {
		const value = declarations.get(name);
		if (!value) return false;
		if (typeof expectedValue === 'string' && value !== expectedValue) return false;
		if (typeof expectedValue === 'function' && !expectedValue(value)) return false;
	}

	return true;
}

function isCustomPropertyReference(value: string): boolean {
	return /^var\(--[\w-]+\)$/.test(value);
}

function isTextTrimSizeDeclarations(declarations: ReadonlyMap<string, string>): boolean {
	if (declarations.size !== 4) return false;

	const sizes = new Set<string>();
	const properties = new Set<string>();
	for (const [name, value] of declarations) {
		if (!name.startsWith('--')) return false;

		const match =
			/^var\(--luke-font-(\d+)-(baseline-trim|cap-height-trim|font-size|line-height)\)$/.exec(
				value,
			);
		if (!match?.[1] || !match[2]) return false;
		if (!retainedTextSizes.some((size) => size === match[1])) return false;

		sizes.add(match[1]);
		properties.add(match[2]);
	}

	return (
		sizes.size === 1 &&
		properties.size === 4 &&
		['baseline-trim', 'cap-height-trim', 'font-size', 'line-height'].every((property) =>
			properties.has(property),
		)
	);
}

function getClassNames(selector: string): Array<string> {
	return [...selector.matchAll(/\.([_a-zA-Z][\w-]*)/g)].map((match) => match[1] ?? '');
}

function getTopLevelNodes(stylesheet: string): Array<StylesheetNode> {
	const nodes: Array<StylesheetNode> = [];
	let start = 0;

	while (start < stylesheet.length) {
		const contentStart = getNextContentStart(stylesheet, start);
		if (contentStart === stylesheet.length) return nodes;

		const blockStart = stylesheet.indexOf('{', contentStart);
		const statementEnd = stylesheet.indexOf(';', contentStart);
		if (statementEnd !== -1 && (blockStart === -1 || statementEnd < blockStart)) {
			const name = stylesheet.slice(contentStart, statementEnd).trim();
			nodes.push({ name, type: 'statement' });
			start = statementEnd + 1;
			continue;
		}

		if (blockStart === -1) throw new Error('Expected a stylesheet block.');

		const name = stylesheet.slice(contentStart, blockStart).trim();
		const blockEnd = getBlockEnd(stylesheet, blockStart + 1);
		const declarations = stylesheet.slice(blockStart + 1, blockEnd);
		nodes.push(getBlockNode(name, declarations));
		start = blockEnd + 1;
	}

	return nodes;
}

function getBlockNode(name: string, declarations: string): StylesheetNode {
	if (name.startsWith('@layer')) return { name, type: 'layer-block' };
	if (!name.startsWith('@')) return { declarations, name, type: 'qualified-rule' };

	return { name: name.split(/\s+/)[0] ?? '', type: 'at-rule' };
}

function getNextContentStart(stylesheet: string, start: number): number {
	for (let index = start; index < stylesheet.length; index += 1) {
		if (stylesheet.startsWith('/*', index)) {
			index = getCommentEnd(stylesheet, index);
			continue;
		}

		if (!/\s/.test(stylesheet[index] ?? '')) return index;
	}

	return stylesheet.length;
}

function getCommentEnd(stylesheet: string, start: number): number {
	const end = stylesheet.indexOf('*/', start + 2);
	if (end === -1) throw new Error('Expected a closing comment delimiter.');

	return end + 1;
}

function getStringEnd(stylesheet: string, start: number): number {
	const quote = stylesheet[start];

	for (let index = start + 1; index < stylesheet.length; index += 1) {
		if (stylesheet[index] === '\\') {
			index += 1;
			continue;
		}

		if (stylesheet[index] === quote) return index;
	}

	throw new Error('Expected a closing string delimiter.');
}

function getBraceDepth(stylesheet: string, end: number): number {
	let depth = 0;

	for (let index = 0; index < end; index += 1) {
		if (stylesheet[index] === '{') depth += 1;
		if (stylesheet[index] === '}') depth -= 1;
	}

	return depth;
}

type StylesheetNode =
	| { declarations: string; name: string; type: 'qualified-rule' }
	| { name: string; type: 'at-rule' | 'layer-block' }
	| { name: string; type: 'statement' };

type QualifiedRule = { declarations: string; selector: string };
