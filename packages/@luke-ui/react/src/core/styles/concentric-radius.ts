import type { Mirror } from '@luke-ui/rainbow-sprinkles';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

// `borderRadius="concentric"` gives a Box the corners of the surface around it, less the inset
// between them. Everything here is static CSS: utility classes mirror their values into private
// custom properties, and a few rules that set only private properties turn those into the corners a flush child
// needs. STYLING.md describes the contract.

type Side = 'blockStart' | 'blockEnd' | 'inlineStart' | 'inlineEnd';

const sides = ['blockStart', 'blockEnd', 'inlineStart', 'inlineEnd'] as const;

/** The two sides a corner sits between, and the logical longhand that rounds it. */
const corners = [
	{ block: 'blockStart', inline: 'inlineStart', property: 'borderStartStartRadius' },
	{ block: 'blockStart', inline: 'inlineEnd', property: 'borderStartEndRadius' },
	{ block: 'blockEnd', inline: 'inlineStart', property: 'borderEndStartRadius' },
	{ block: 'blockEnd', inline: 'inlineEnd', property: 'borderEndEndRadius' },
] as const;

/** Far enough below zero that a `max()` term with it never wins. */
const far = 100_000;

const unwrap = (reference: string) => reference.slice(4, -1);

// Inputs are registered and do not inherit, so a Box reads only the values its own utility classes
// set. Registration also computes the space scale's unitless `0` to a length.
const length = (name: string, initialValue = '0px') =>
	createVar({ inherits: false, initialValue, syntax: '<length>' }, name);
const flag = (name: string) =>
	createVar({ inherits: false, initialValue: '0', syntax: '<number>' }, name);

/**
 * Creates the concentric custom properties. Call it from a `.css.ts` module: Vanilla Extract
 * assigns the properties to the calling file.
 *
 * `mirrors` attach to the utility properties a Box's corners depend on. `emitRules` writes the rules
 * that turn those values into corners and returns the class that `borderRadius="concentric"` sets.
 */
export function defineConcentricRadius(): {
	emitRules: (layer: string, geometryClasses: ReadonlyArray<string>) => string;
	mirrors: Record<string, Mirror>;
} {
	// Inputs, one set per element. See `length` and `flag`.
	const padding: Record<Side, string> = {
		blockEnd: length('concentric-padding-block-end'),
		blockStart: length('concentric-padding-block-start'),
		inlineEnd: length('concentric-padding-inline-end'),
		inlineStart: length('concentric-padding-inline-start'),
	};
	const radius = length('concentric-radius');
	/** 1 when a `borderRadius` class applies at the current width. */
	const hasRadius = flag('concentric-has-radius');
	/** `medium` computes to 3px in every browser, which is what an unset width draws. */
	const borderWidth = length('concentric-border-width', '3px');
	/** 1 when a `borderStyle` other than `none` applies at the current width. */
	const borderDrawn = flag('concentric-border-drawn');

	// Outputs, inherited. For each side, the radius left for a flush child on that side's axis. A
	// custom property cannot be defined from its own inherited value, so there are two sets. A Box
	// that passes values on reads one set and writes the other.
	const outputs = (set: string) =>
		Object.fromEntries(
			sides.map((side) => [side, createVar(`concentric-${set}-${side}`)]),
		) as Record<Side, string>;
	const setA = outputs('a');
	const setB = outputs('b');
	/** Which set the next Box reads: `1` for B, `2` for A. */
	const parity = createVar('concentric-parity');

	const toSides =
		(...names: ReadonlyArray<Side>): Mirror =>
		(value) =>
			Object.fromEntries(names.map((name) => [padding[name], value]));
	const mirrors: Record<string, Mirror> = {
		borderRadius: (value) => ({ [hasRadius]: '1', [radius]: value }),
		borderStyle: (value) => ({ [borderDrawn]: value === 'none' ? '0' : '1' }),
		borderWidth: (value) => ({ [borderWidth]: value }),
		padding: toSides('blockStart', 'blockEnd', 'inlineStart', 'inlineEnd'),
		paddingBlock: toSides('blockStart', 'blockEnd'),
		paddingBlockEnd: toSides('blockEnd'),
		paddingBlockStart: toSides('blockStart'),
		paddingInline: toSides('inlineStart', 'inlineEnd'),
		paddingInlineEnd: toSides('inlineEnd'),
		paddingInlineStart: toSides('inlineStart'),
	};

	const read = (set: Record<Side, string>, side: Side) => `var(${unwrap(set[side])}, 0px)`;
	const border = `${borderWidth} * ${borderDrawn}`;
	/** A Box's own radius, less its padding and border. */
	const ownRadius = (side: Side) => `${radius} - ${padding[side]} - ${border}`;

	/** A Box with no participating ancestor offers its own radius, less its padding and border. */
	const fromRadius = (side: Side) => `max(0px, ${ownRadius(side)})`;
	/** A concentric Box offers the corners it was given, less its padding and border. */
	const fromParent = (reads: Record<Side, string>) => (side: Side) =>
		`max(0px, ${read(reads, side)} - ${padding[side]} - ${border})`;
	/**
	 * Any other Box decides from the values that win the cascade at the current width. A radius or a
	 * drawn border makes the second term far below zero, so the Box is a surface and offers its own
	 * radius. A drawn border with no radius offers zero: a square surface. With neither, the Box is
	 * spacing and passes on what it was given, less its padding.
	 */
	const fromValues = (reads: Record<Side, string>) => (side: Side) =>
		`max(0px, ${ownRadius(side)}, ${read(reads, side)} - ${padding[side]} - ${border} * ${far} - ${hasRadius} * ${far}px)`;

	const write = (set: Record<Side, string>, value: (side: Side) => string) =>
		Object.fromEntries(sides.map((side) => [set[side], value(side)]));
	const inherit = (set: Record<Side, string>) =>
		Object.fromEntries(sides.map((side) => [set[side], 'inherit']));
	const cornersFrom = (reads: Record<Side, string>) =>
		Object.fromEntries(
			corners.map((corner) => [
				corner.property,
				`${read(reads, corner.inline)} ${read(reads, corner.block)}`,
			]),
		);

	// Every rule here has the specificity of one class, like every other utility. Only
	// `.concentric` sets a CSS property. The other rules set private custom properties that no other
	// rule sets, so they compete only with each other, and a later rule wins. Each of those applies
	// only to a Box that contains a concentric Box.
	const emitRules = (layer: string, geometryClasses: ReadonlyArray<string>) => {
		const concentric = style({ '@layer': { [layer]: {} } }, 'concentric');
		const inLayer = (rule: Record<string, unknown>, query?: string) => ({
			'@layer': { [layer]: query ? { '@container': { [query]: rule } } : rule },
		});
		// Each selector leads with one plain class, so browsers index the rule by that class and test
		// it only against elements that have it. The rest sits inside `:where()`, so every rule has
		// the specificity of one class, like every utility.
		const box = geometryClasses
			.map((className) => `.${className}:where(:has(.${concentric}):not(.${concentric}))`)
			.join(',');
		const nested = `.${concentric}:where(:has(.${concentric}))`;
		const wroteB = `style(${unwrap(parity)}: 1)`;
		const wroteA = `style(${unwrap(parity)}: 2)`;

		// Base rules: what applies with no participating ancestor, and all a browser without
		// container style queries applies. A Box writes both sets from its own values, so its
		// children may read either. A concentric Box reads A and writes B.
		globalStyle(
			box,
			inLayer({ vars: { ...write(setA, fromRadius), ...write(setB, fromRadius), [parity]: '2' } }),
		);
		globalStyle(`.${concentric}`, inLayer(cornersFrom(setA)));
		globalStyle(
			nested,
			inLayer({ vars: { ...inherit(setA), ...write(setB, fromParent(setA)), [parity]: '1' } }),
		);

		// Under a Box that wrote B, read B and write A. `inherit` replaces the base rule's value for
		// the set being read, which would otherwise define the two sets from each other.
		globalStyle(
			box,
			inLayer(
				{ vars: { ...inherit(setB), ...write(setA, fromValues(setB)), [parity]: '2' } },
				wroteB,
			),
		);
		globalStyle(`.${concentric}`, inLayer(cornersFrom(setB), wroteB));
		globalStyle(
			nested,
			inLayer(
				{ vars: { ...inherit(setB), ...write(setA, fromParent(setB)), [parity]: '2' } },
				wroteB,
			),
		);

		// Under a Box that wrote A, a concentric Box's base rules already apply. Any other Box now
		// has corners to pass on.
		globalStyle(
			box,
			inLayer(
				{ vars: { ...inherit(setA), ...write(setB, fromValues(setA)), [parity]: '1' } },
				wroteA,
			),
		);

		return concentric;
	};

	return { emitRules, mirrors };
}
