/** Guards the utility prop types emitted for package consumers. */

import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { breakpoints } from '../../theme/breakpoints.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';

const UTILITIES_CSS_PATTERN = /utilities\.css-[A-Za-z0-9_-]+/;
const INDEX_SIGNATURE_PATTERN = /\[\s*\w+\s*:\s*string\s*\]/;
const BACKGROUND_COLOR_TOKEN_PATTERN = /type BackgroundColorToken = ([^;]+);/;
const NUMERIC_ZERO_PATTERN = /(^|[{;\s])0:/;
const READONLY_PROPERTY_PATTERN_CACHE = new Map<string, RegExp>();

function getReadonlyPropertyPattern(property: string): RegExp {
	let pattern = READONLY_PROPERTY_PATTERN_CACHE.get(property);
	if (pattern === undefined) {
		pattern = new RegExp(`readonly ${property}:`);
		READONLY_PROPERTY_PATTERN_CACHE.set(property, pattern);
	}
	return pattern;
}

/** Reads the content-hashed declaration chunk referenced by `box.d.ts`. */
async function readUtilitiesDeclaration(): Promise<string> {
	const boxDeclaration = await readFile(new URL('../../../dist/box.d.ts', import.meta.url), 'utf8');
	const chunk = UTILITIES_CSS_PATTERN.exec(boxDeclaration)?.[0];
	if (chunk === undefined) {
		throw new Error('Could not find the utilities declaration chunk from dist/box.d.ts');
	}
	return readFile(new URL(`../../../dist/${chunk}.d.ts`, import.meta.url), 'utf8');
}

/** Extracts one property's declared type while balancing braces. */
function propertyType(declaration: string, property: string): string {
	const marker = getReadonlyPropertyPattern(property).exec(declaration);
	if (marker?.index === undefined) {
		throw new Error(`Property "${property}" is not present in the emitted declaration`);
	}
	const start = marker.index + marker[0].length;
	let depth = 0;
	for (let index = start; index < declaration.length; index += 1) {
		const character = declaration[index];
		if (character === '{') depth += 1;
		else if (character === '}') depth -= 1;
		else if (character === ';' && depth === 0) return declaration.slice(start, index);
	}
	throw new Error(`Could not read the emitted type for "${property}"`);
}

const spaceScaleProperties = ['gap', 'padding', 'margin', 'columnGap', 'rowGap'] as const;

test('the zero space key stays a quoted string in declaration emit', async () => {
	const declaration = await readUtilitiesDeclaration();
	const missing: Array<string> = [];

	for (const property of spaceScaleProperties) {
		const emitted = propertyType(declaration, property);
		if (!emitted.includes("'0':")) missing.push(`${property}.quoted`);
		if (NUMERIC_ZERO_PATTERN.test(emitted)) missing.push(`${property}.numeric`);
	}

	expect(missing).toEqual([]);
});

test('backgroundColor is keyed by tokens, not by an index signature', async () => {
	const declaration = await readUtilitiesDeclaration();
	const emitted = propertyType(declaration, 'backgroundColor');

	expect(emitted, 'backgroundColor widened to an index signature').not.toMatch(
		INDEX_SIGNATURE_PATTERN,
	);
	expect(emitted.trim()).not.toBe('true');

	// Declaration emit may inline the type or retain its alias.
	const alias = BACKGROUND_COLOR_TOKEN_PATTERN.exec(declaration)?.[1] ?? '';
	const tokenSource = emitted.includes('"') ? emitted : alias;
	expect(tokenSource, 'no token vocabulary found for backgroundColor').toBeTruthy();

	const mentionsRoles =
		SEMANTIC_ROLES.every((role) => tokenSource.includes(`"${role}.subtle.rest"`)) ||
		(tokenSource.includes('SemanticRole') &&
			tokenSource.includes('ProminenceLevel') &&
			tokenSource.includes('InteractionState'));
	expect(mentionsRoles, `backgroundColor lost its role tokens: ${tokenSource}`).toBe(true);

	const mentionsSurfaces =
		tokenSource.includes('surface.') || tokenSource.includes('"surface.canvas"');
	expect(mentionsSurfaces, `backgroundColor lost its surface tokens: ${tokenSource}`).toBe(true);

	// A translucent scrim is not an opaque fill.
	expect(tokenSource).not.toContain('overlay.backdrop');
});

test('constrained appearance props do not accept arbitrary CSS values', async () => {
	const declaration = await readUtilitiesDeclaration();

	// `true` accepts arbitrary CSS values, including CSS-wide keywords.
	for (const property of ['borderWidth', 'borderStyle', 'borderColor', 'borderRadius'] as const) {
		expect(propertyType(declaration, property).trim()).not.toBe('true');
	}

	// Named widths, not raw lengths: the emitted keys must be the token names the scale declares.
	const emittedBorderWidth = propertyType(declaration, 'borderWidth');
	const missingWidths = ['none', 'thin', 'thick'].filter((width) => {
		return !emittedBorderWidth.includes(`${width}:`);
	});
	expect(missingWidths).toEqual([]);

	expect(propertyType(declaration, 'borderStyle')).toContain('solid');
});

test('responsive conditions preserve breakpoint declaration order', async () => {
	const declaration = await readUtilitiesDeclaration();
	// Conditions are matched by name and checked in declaration order.
	const expected = ['initial', ...Object.keys(breakpoints)];
	const emittedOrder = expected
		.map((name) => ({ index: getReadonlyPropertyPattern(name).exec(declaration)?.index, name }))
		.sort((a, b) => (a.index ?? -1) - (b.index ?? -1))
		.map(({ name }) => name);

	for (const name of expected) {
		expect(declaration, `condition "${name}" is missing from the emitted config`).toMatch(
			getReadonlyPropertyPattern(name),
		);
	}
	// Declaration order controls editor completion order.
	expect(emittedOrder).toEqual(expected);
});
