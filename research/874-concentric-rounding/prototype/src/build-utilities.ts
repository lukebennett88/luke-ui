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

/**
 * How a Box learns which set to read:
 *
 * - `query`: a container style query reads the parity its nearest participating ancestor set.
 * - `selectors`: descendant selectors count participating ancestors, up to `CONCENTRIC_DEPTH`.
 * - `both`: selectors first, overridden by the query where the browser supports it.
 * - `none`: no alternation, which is what `query` degrades to in a browser without style queries.
 */
const ALTERNATION = process.env.CONCENTRIC_ALTERNATION ?? 'query';
const CONCENTRIC_DEPTH = Number(process.env.CONCENTRIC_DEPTH ?? 4);
/** A Box with padding or a border and no radius passes its surface's corners on, less its inset. */
const WRAPPERS = process.env.CONCENTRIC_WRAPPERS !== '0';
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

	const inset = (side: Side) => `${pad[side]} - ${borderWidth} * ${borderDrawn}`;
	const publish = (target: Record<Side, string>, outer: (side: Side) => string) =>
		Object.fromEntries(
			(Object.keys(target) as Array<Side>).map((side) => [
				target[side],
				`max(0px, ${outer(side)} - ${inset(side)})`,
			]),
		);

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
	const radiusClasses = classesOf('borderRadius');
	const spacingClasses = classesOf(
		'padding',
		'paddingBlock',
		'paddingBlockEnd',
		'paddingBlockStart',
		'paddingInline',
		'paddingInlineEnd',
		'paddingInlineStart',
		'borderWidth',
	);

	if (!REGISTER_INPUTS) {
		// Unregistered inputs inherit, so every Box that reads them first resets the ones it does not
		// set. Zero specificity keeps the reset below the mirrors in the property classes.
		globalStyle(`:where(${radiusClasses},${spacingClasses},.${concentric})`, {
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

	// Three kinds of Box take part. Every publishing rule sits inside `:where()`, so the kinds
	// never compete on specificity, and applies only to a Box that contains a concentric Box.
	//
	// - A surface has a radius. It publishes both sets from its own radius.
	// - A concentric Box takes its corners from one set and publishes the other.
	// - A wrapper has padding or a border and no radius. It publishes like a concentric Box and
	//   keeps its own square corners. With `CONCENTRIC_WRAPPERS=0` it is a surface with no radius.
	const gate = GATE_WITH_HAS ? `:has(.${concentric})` : '';
	const surface = WRAPPERS
		? `:where(${radiusClasses})`
		: `:where(${radiusClasses},${spacingClasses})`;
	const wrapper = `:where(${spacingClasses}):not(${radiusClasses})`;
	const participant = WRAPPERS ? `:where(.${concentric},${wrapper})` : `.${concentric}`;

	globalStyle(`:where(${surface}${gate}:not(.${concentric}))`, {
		'@layer': {
			[layer]: { vars: { ...publish(setA, () => radius), ...publish(setB, () => radius) } },
		},
	});

	const parity = createVar('concentric-parity');
	const read = (set: Record<Side, string>, side: Side) => `var(${unwrap(set[side])}, 0px)`;
	const cornersFrom = (reads: Record<Side, string>) =>
		Object.fromEntries(
			(Object.keys(corners) as Array<Corner>).map((corner) => [
				corners[corner].property,
				`${read(reads, corners[corner].inline)} ${read(reads, corners[corner].block)}`,
			]),
		);
	// `inherit` undoes an earlier rule that published into the set this one reads. Without it the
	// two sets would be defined from each other, which makes both invalid.
	const republish = (reads: Record<Side, string>, writes: Record<Side, string>, mark: string) => ({
		vars: {
			...Object.fromEntries(Object.values(reads).map((name) => [name, 'inherit'])),
			...publish(writes, (side) => read(reads, side)),
			...(ALTERNATION === 'query' || ALTERNATION === 'both' ? { [parity]: mark } : {}),
		},
	});
	/** Emits the rules for one parity, under optional ancestors and an optional style query. */
	const emit = (odd: boolean, ancestors = '', query?: string) => {
		const [reads, writes] = odd ? [setA, setB] : [setB, setA];
		const under = ancestors ? `:where(${ancestors}) ` : '';
		const wrap = (rule: Record<string, unknown>) => ({
			'@layer': { [layer]: query ? { '@container': { [query]: rule } } : rule },
		});
		globalStyle(`${under}.${concentric}`, wrap(cornersFrom(reads)));
		globalStyle(
			`:where(${under}${participant}${gate})`,
			wrap(republish(reads, writes, odd ? '1' : '2')),
		);
	};

	emit(true);
	if (ALTERNATION === 'selectors' || ALTERNATION === 'both') {
		// Past `CONCENTRIC_DEPTH` the last rule keeps applying.
		for (let depth = 2; depth <= CONCENTRIC_DEPTH; depth++) {
			emit(depth % 2 === 1, Array.from({ length: depth - 1 }, () => participant).join(' '));
		}
	}
	if (ALTERNATION === 'both') emit(true, '', `style(${unwrap(parity)}: 2)`);
	if (ALTERNATION === 'query' || ALTERNATION === 'both') {
		emit(false, '', `style(${unwrap(parity)}: 1)`);
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
