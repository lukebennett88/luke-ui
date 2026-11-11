import { createVar, globalStyle, style } from '@vanilla-extract/css';
// Builds the geometry-relevant slice of Box's utilities, either as production emits them today
// (`baseline`) or with the proposed concentric support (`concentric`). Scales and conditions come
// from the production modules. Properties that neither variant touches are left out, so the byte
// difference between the two builds is the cost of the feature.
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';
import { createRuntimeFn } from '../../../../packages/@luke-ui/rainbow-sprinkles/src/create-runtime-fn.js';
import { layers } from '../../../../packages/@luke-ui/react/src/core/styles/layers.css.js';
import { responsiveConditions } from '../../../../packages/@luke-ui/react/src/core/styles/responsive-conditions.js';
import { spaceTokens } from '../../../../packages/@luke-ui/react/src/core/styles/space-tokens.js';
import { vars } from '../../../../packages/@luke-ui/react/src/theme/contract.css.js';
import { defineProperties } from './engine.js';
import type { Mirror } from './engine.js';

/** `0` builds what a browser without container style queries sees: the base rules only. */
const WITH_STYLE_QUERY = process.env.CONCENTRIC_STYLE_QUERY !== '0';
const GATE_WITH_HAS = process.env.CONCENTRIC_HAS !== '0';
const REGISTER_INPUTS = process.env.CONCENTRIC_REGISTER_INPUTS !== '0';

// Registered inputs compute production's unitless `0` to a length. Unregistered ones are
// substituted as written, and `calc()` cannot subtract a unitless zero from a length.
const zero = REGISTER_INPUTS ? '0' : '0px';
const spaceScale = { '0': zero, ...spaceTokens };
const borderStyles = { dashed: 'dashed', dotted: 'dotted', none: 'none', solid: 'solid' };

const shared = {
	backgroundColor: true,
	borderColor: true,
	borderWidth: { none: zero, thick: '2px', thin: '1px' },
	display: true,
	flexDirection: true,
	gap: spaceScale,
	inlineSize: true,
	margin: spaceScale,
	padding: spaceScale,
	paddingBlock: spaceScale,
	paddingBlockEnd: spaceScale,
	paddingBlockStart: spaceScale,
	paddingInline: spaceScale,
	paddingInlineEnd: spaceScale,
	paddingInlineStart: spaceScale,
} as const;

const corners = {
	ee: { inline: 'ie', property: 'borderEndEndRadius', block: 'be' },
	es: { inline: 'is', property: 'borderEndStartRadius', block: 'be' },
	se: { inline: 'ie', property: 'borderStartEndRadius', block: 'bs' },
	ss: { inline: 'is', property: 'borderStartStartRadius', block: 'bs' },
} as const;
type Corner = keyof typeof corners;
type Side = 'bs' | 'be' | 'is' | 'ie';

function serialise(config: { config: Record<string, unknown> }) {
	const sprinkles = createRuntimeFn(config as never);
	return addFunctionSerializer(sprinkles, {
		args: [config] as never,
		importName: 'createRuntimeFn',
		importPath: '#create-runtime-fn',
	});
}

export function buildBaseline() {
	return serialise(
		defineProperties({
			conditions: responsiveConditions,
			dynamicProperties: { ...shared, borderRadius: vars.radius, borderStyle: borderStyles },
			layer: layers.utilities,
		}),
	);
}

export function buildConcentric() {
	const layer = layers.utilities;
	// Per-element inputs. Registered as non-inheriting, so a Box that sets no padding reads `0px`
	// instead of an ancestor's value, and a unitless `0` from the space scale computes to a length.
	const length = (name: string) =>
		REGISTER_INPUTS
			? createVar({ inherits: false, initialValue: '0px', syntax: '<length>' }, name)
			: createVar(name);
	const pad: Record<Side, string> = {
		be: length('pad-be'),
		bs: length('pad-bs'),
		ie: length('pad-ie'),
		is: length('pad-is'),
	};
	const radius = length('radius');
	const borderWidth = length('border-width');
	const borderDrawn = REGISTER_INPUTS
		? createVar({ inherits: false, initialValue: '0', syntax: '<number>' }, 'border-drawn')
		: createVar('border-drawn');

	// Inherited outputs: for each side, the radius left for a flush child on that side's axis, which
	// is the Box's own radius minus its inset there. A corner takes its horizontal radius from its
	// inline side and its vertical radius from its block side. Published twice: a concentric Box
	// reads one set and publishes the other, because a custom property cannot be defined from its
	// own inherited value.
	const published = (set: 'a' | 'b') =>
		Object.fromEntries(
			(['bs', 'be', 'is', 'ie'] as const).map((side) => [
				side,
				createVar(`concentric-${set}-${side}`),
			]),
		) as Record<Side, string>;
	const setA = published('a');
	const setB = published('b');

	const sides = (...names: Array<Side>): Mirror => {
		return (value) => Object.fromEntries(names.map((name) => [pad[name], value]));
	};

	const config = defineProperties({
		conditions: responsiveConditions,
		dynamicProperties: { ...shared, borderRadius: vars.radius },
		layer,
		mirrors: {
			borderRadius: (value) => ({ [radius]: value }),
			borderWidth: (value) => ({ [borderWidth]: value }),
			padding: sides('bs', 'be', 'is', 'ie'),
			paddingBlock: sides('bs', 'be'),
			paddingBlockEnd: sides('be'),
			paddingBlockStart: sides('bs'),
			paddingInline: sides('is', 'ie'),
			paddingInlineEnd: sides('ie'),
			paddingInlineStart: sides('is'),
		},
		staticMirrors: { borderStyle: (key) => ({ [borderDrawn]: key === 'none' ? '0' : '1' }) },
		staticProperties: { borderStyle: borderStyles },
	});

	const border = `${borderWidth} * ${borderDrawn}`;
	const sideNames = ['bs', 'be', 'is', 'ie'] as const;
	const assign = (target: Record<Side, string>, value: (side: Side) => string) =>
		Object.fromEntries(sideNames.map((side) => [target[side], value(side)]));
	const read = (set: Record<Side, string>, side: Side) => `var(${unwrap(set[side])}, 0px)`;

	// What a Box offers a flush child on one side.
	//
	// A concentric Box offers the corners it was given, less its own inset.
	const fromParent = (reads: Record<Side, string>) => (side: Side) =>
		`max(0px, ${read(reads, side)} - ${pad[side]} - ${border})`;
	// A Box with a radius is a surface: it offers its own radius, less its inset.
	const fromRadius = (side: Side) => `max(0px, ${radius} - ${pad[side]} - ${border})`;
	// Any other Box decides from its values, so the answer follows the cascade and each breakpoint.
	// With a radius, the first term is the surface's answer and the second is far below zero. With
	// no radius and a drawn border, both are below zero: the Box is a square surface. With neither,
	// the second term passes the parent's corners on, less the padding.
	const far = '100000';
	const fromValues = (reads: Record<Side, string>) => (side: Side) =>
		`max(0px, ${radius} - ${pad[side]} - ${border}, ${read(reads, side)} - ${radius} * ${far} - ${pad[side]} - ${border} * ${far})`;

	const concentric = style({}, 'concentric');
	const classesOf = (...properties: Array<string>) =>
		properties
			.flatMap((property) => {
				const entry = config.config[property] as {
					dynamic: { conditions: Record<string, string> };
				};
				return Object.values(entry.dynamic.conditions).map((className) => `.${className}`);
			})
			.join(',');
	const geometryClasses = classesOf(
		'padding',
		'paddingBlock',
		'paddingBlockEnd',
		'paddingBlockStart',
		'paddingInline',
		'paddingInlineEnd',
		'paddingInlineStart',
		'borderWidth',
		'borderRadius',
	);

	if (!REGISTER_INPUTS) {
		// Unregistered inputs inherit, so every Box that reads them first resets the ones it does not
		// set. Zero specificity keeps the reset below the mirrors in the property classes.
		globalStyle(`:where(${geometryClasses},.${concentric})`, {
			'@layer': {
				[layer]: {
					vars: {
						...Object.fromEntries(Object.values(pad).map((name) => [name, '0px'])),
						[borderDrawn]: '0',
						[borderWidth]: '0px',
						[radius]: '0px',
					},
				},
			},
		});
	}

	// Every rule that publishes sits inside `:where()`, so it has no specificity and source order
	// alone decides between them. Each applies only to a Box that contains a concentric Box.
	const gate = GATE_WITH_HAS ? `:has(.${concentric})` : '';
	const box = `:where(:where(${geometryClasses})${gate}:not(.${concentric}))`;
	const nested = `:where(.${concentric}${gate})`;
	const parity = createVar('concentric-parity');
	const inherit = (set: Record<Side, string>) =>
		Object.fromEntries(Object.values(set).map((name) => [name, 'inherit']));
	const cornersFrom = (reads: Record<Side, string>) =>
		Object.fromEntries(
			(Object.keys(corners) as Array<Corner>).map((corner) => [
				corners[corner].property,
				`${read(reads, corners[corner].inline)} ${read(reads, corners[corner].block)}`,
			]),
		);
	const inLayer = (rule: Record<string, unknown>, query?: string) => ({
		'@layer': { [layer]: query ? { '@container': { [query]: rule } } : rule },
	});

	// Base rules. They are all a browser without container style queries applies, and all a Box
	// with no participating ancestor needs.
	//
	// - A Box writes both sets from its own radius, so its children may read either.
	// - A concentric Box reads A and writes B.
	//
	// The parity says which set the next Box reads: 1 for B, 2 for A.
	globalStyle(
		box,
		inLayer({ vars: { ...assign(setA, fromRadius), ...assign(setB, fromRadius), [parity]: '2' } }),
	);
	globalStyle(`.${concentric}`, inLayer(cornersFrom(setA)));
	globalStyle(
		nested,
		inLayer({ vars: { ...inherit(setA), ...assign(setB, fromParent(setA)), [parity]: '1' } }),
	);

	if (WITH_STYLE_QUERY) {
		// Under a Box that wrote B: read B and write A. `inherit` replaces the base rule's value for
		// the set being read. Without it the two sets would be defined from each other.
		const wroteB = `style(${unwrap(parity)}: 1)`;
		globalStyle(
			box,
			inLayer(
				{ vars: { ...inherit(setB), ...assign(setA, fromValues(setB)), [parity]: '2' } },
				wroteB,
			),
		);
		globalStyle(`.${concentric}`, inLayer(cornersFrom(setB), wroteB));
		globalStyle(
			nested,
			inLayer(
				{ vars: { ...inherit(setB), ...assign(setA, fromParent(setB)), [parity]: '2' } },
				wroteB,
			),
		);
		// Under a Box that wrote A, a concentric Box's base rule is already right. A plain Box now
		// has corners to pass on.
		globalStyle(
			box,
			inLayer(
				{ vars: { ...inherit(setA), ...assign(setB, fromValues(setA)), [parity]: '1' } },
				`style(${unwrap(parity)}: 2)`,
			),
		);
	}

	const borderRadius = config.config.borderRadius as Record<string, unknown>;
	config.config.borderRadius = {
		...borderRadius,
		staticScale: ['concentric'],
		values: { concentric: once(concentric) },
	};

	return { createSprinkles: serialise(config), names: { setA, setB } };
}

/** A static value that only exists at the `initial` condition, so it cannot be responsive. */
function once(className: string) {
	return { conditions: { initial: className }, default: className };
}

/** `var(--name)` to `--name`. */
function unwrap(reference: string) {
	return reference.slice(4, -1);
}
