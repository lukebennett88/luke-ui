/** Guards the utility prop types emitted for package consumers. */

import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { breakpoints } from '../theme/breakpoints.js';
import type { SpaceStep } from '../theme/contract.js';
import { spaceScale } from '../theme/contract.js';
import { SEMANTIC_ROLES } from '../theme/contrast-policy.js';

/** Reads the content-hashed declaration chunk referenced by `box/index.d.ts`. */
async function readUtilitiesDeclaration(): Promise<string> {
	const boxDeclaration = await readFile(
		new URL('../../dist/box/index.d.ts', import.meta.url),
		'utf8',
	);
	const chunk = /utilities\.css-[A-Za-z0-9_-]+/.exec(boxDeclaration)?.[0];
	if (chunk === undefined) {
		throw new Error('Could not find the utilities declaration chunk from dist/box/index.d.ts');
	}
	return readFile(new URL(`../../dist/${chunk}.d.ts`, import.meta.url), 'utf8');
}

/** Extracts one property's declared type while balancing braces. */
function propertyType(declaration: string, property: string): string {
	const marker = new RegExp(`readonly ${property}:`).exec(declaration);
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

const spaceSteps: ReadonlyArray<SpaceStep> = spaceScale.map(([step]) => step);
const spaceScaleProperties = ['gap', 'padding', 'margin', 'columnGap', 'rowGap'] as const;

test('space-scale props keep quoted string keys for every step', async () => {
	const declaration = await readUtilitiesDeclaration();

	// Collect all regressions so one failure reports every property and step.
	const unquoted: Array<string> = [];
	for (const property of spaceScaleProperties) {
		const emitted = propertyType(declaration, property);
		for (const step of spaceSteps) {
			// An unquoted `400:` makes `keyof` numeric.
			const isQuoted = emitted.includes(`'${step}':`);
			const isNumeric = new RegExp(`(^|[{;\\s])${step}:`).test(emitted);
			if (!isQuoted || isNumeric) unquoted.push(`${property}.${step}`);
		}
	}

	expect(unquoted).toEqual([]);
});

test('backgroundColor is keyed by tokens, not by an index signature', async () => {
	const declaration = await readUtilitiesDeclaration();
	const emitted = propertyType(declaration, 'backgroundColor');

	expect(emitted, 'backgroundColor widened to an index signature').not.toMatch(
		/\[\s*\w+\s*:\s*string\s*\]/,
	);
	expect(emitted.trim()).not.toBe('true');

	// Declaration emit may inline the type or retain its alias.
	const alias = /type BackgroundColorToken = ([^;]+);/.exec(declaration)?.[1] ?? '';
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

/** Declaration emit quotes a numeric-string key (`'640'`) but leaves an identifier key bare. */
function declaredCondition(name: string): RegExp {
	return /^\d+$/.test(name) ? new RegExp(`readonly '${name}':`) : new RegExp(`readonly ${name}:`);
}

test('responsive conditions expose the theme breakpoints in width order', async () => {
	const declaration = await readUtilitiesDeclaration();
	// Conditions are matched by name and checked in declaration order.
	const expected = ['initial', ...Object.keys(breakpoints)];
	const emittedOrder = expected
		.map((name) => ({ index: declaredCondition(name).exec(declaration)?.index, name }))
		.sort((a, b) => (a.index ?? -1) - (b.index ?? -1))
		.map(({ name }) => name);

	for (const name of expected) {
		expect(declaration, `condition "${name}" is missing from the emitted config`).toMatch(
			declaredCondition(name),
		);
	}
	// Declaration order controls editor completion order.
	expect(emittedOrder).toEqual(expected);
});
