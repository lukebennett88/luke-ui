/** Guards the utility prop types emitted for package consumers. */

import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { breakpoints } from '../../theme/breakpoints.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';

const UTILITIES_CSS_PATTERN = /utilities\.css-[A-Za-z0-9_-]+/;
const BACKGROUND_INTERACTION_STATE_PATTERN = /\.(rest|hover|pressed)["']/;
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
	const boxDeclarationUrl = new URL('../../../dist/box.d.ts', import.meta.url);
	let boxDeclaration: string;
	try {
		boxDeclaration = await readFile(boxDeclarationUrl, 'utf8');
	} catch (error) {
		throw new Error(
			'Could not read dist/box.d.ts — this test reads emitted declarations, so run build first (pnpm run build).',
			{ cause: error },
		);
	}
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

test('backgroundColor preserves its resting role and surface token vocabulary', async () => {
	const declaration = await readUtilitiesDeclaration();
	const tokens = [
		...SEMANTIC_ROLES.flatMap((role) => [`${role}.subtle`, `${role}.solid`]),
		...['base', 'subdued', 'field', 'raised'].map((surface) => `surface.${surface}`),
	];
	const missingTokens = tokens.filter((token) => {
		return !declaration.includes(`'${token}'`) && !declaration.includes(`"${token}"`);
	});

	expect(missingTokens).toEqual([]);
	// Box takes resting fills only. Interaction states stay recipe tokens.
	expect(declaration).not.toMatch(BACKGROUND_INTERACTION_STATE_PATTERN);
	// A translucent scrim is not an opaque fill.
	expect(declaration).not.toContain('overlay.backdrop');
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
		.toSorted((a, b) => (a.index ?? -1) - (b.index ?? -1))
		.map(({ name }) => name);

	for (const name of expected) {
		expect(declaration, `condition "${name}" is missing from the emitted config`).toMatch(
			getReadonlyPropertyPattern(name),
		);
	}
	// Declaration order controls editor completion order.
	expect(emittedOrder).toEqual(expected);
});

test('public utilities declarations do not import a styling-engine package', async () => {
	const declaration = await readUtilitiesDeclaration();
	expect(declaration).not.toMatch(/from ["']@luke-ui\/rainbow-sprinkles["']/);
	expect(declaration).not.toMatch(/from ["']@vanilla-extract\//);
	expect(declaration).toContain('type SprinklesProps =');
});
