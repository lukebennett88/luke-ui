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

/** How many levels of directly nested concentric Boxes resolve exactly. */
export const CONCENTRIC_DEPTH = Number(process.env.CONCENTRIC_DEPTH ?? 4);
/** The style-query alternative is built only for comparison. */
const GATE_WITH_HAS = process.env.CONCENTRIC_HAS !== '0';
const REGISTER_INPUTS = process.env.CONCENTRIC_REGISTER_INPUTS !== '0';
const WITH_QUERY = process.env.CONCENTRIC_QUERY !== '0';

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
	const queried = style({}, 'concentric-query');

	// 1. Any Box with padding, a border, or a radius publishes both sets from its own radius.
	//    `:where()` keeps the rule at zero specificity. A concentric Box is excluded, so the set it
	//    reads still holds its parent's values.
	const geometryClasses = [
		'padding',
		'paddingBlock',
		'paddingBlockEnd',
		'paddingBlockStart',
		'paddingInline',
		'paddingInlineEnd',
		'paddingInlineStart',
		'borderWidth',
		'borderRadius',
	].flatMap((property) => {
		const entry = config.config[property] as { dynamic: { conditions: Record<string, string> } };
		return Object.values(entry.dynamic.conditions).map((className) => `.${className}`);
	});
	if (!REGISTER_INPUTS) {
		// Unregistered inputs inherit, so every Box that reads them first resets the ones it does not
		// set. Zero specificity keeps the reset below the mirrors in the property classes.
		globalStyle(`:where(${geometryClasses.join(',')},.${concentric},.${queried})`, {
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
	const opted = `.${concentric},.${queried}`;
	const gate = GATE_WITH_HAS ? `:has(${opted})` : '';
	globalStyle(`:where(:where(${geometryClasses.join(',')})${gate}:not(${opted}))`, {
		'@layer': {
			[layer]: { vars: { ...publish(setA, () => radius), ...publish(setB, () => radius) } },
		},
	});

	// 2. A concentric Box takes its corners from one set and publishes into the other. Which one
	//    alternates with the number of concentric ancestors. Past `CONCENTRIC_DEPTH` the last rule
	//    keeps applying.
	const read = (set: Record<Side, string>, side: Side) => `var(${unwrap(set[side])}, 0px)`;
	const rule = (reads: Record<Side, string>) =>
		Object.fromEntries(
			(Object.keys(corners) as Array<Corner>).map((corner) => [
				corners[corner].property,
				`${read(reads, corners[corner].inline)} ${read(reads, corners[corner].block)}`,
			]),
		);
	// `inherit` undoes a shallower rule that published into the set this depth reads. Without it
	// the two sets would be defined from each other, which makes both invalid.
	const republish = (reads: Record<Side, string>, writes: Record<Side, string>) => ({
		vars: {
			...Object.fromEntries(Object.values(reads).map((name) => [name, 'inherit'])),
			...publish(writes, (side) => read(reads, side)),
		},
	});
	for (let depth = 1; depth <= CONCENTRIC_DEPTH; depth++) {
		const ancestors = Array.from({ length: depth - 1 }, () => `.${concentric}`).join(' ');
		const selector = ancestors ? `:where(${ancestors}) .${concentric}` : `.${concentric}`;
		const [reads, writes] = depth % 2 === 1 ? [setA, setB] : [setB, setA];
		globalStyle(selector, { '@layer': { [layer]: rule(reads) } });
		// `:where()` around the gate keeps every concentric rule at one class of specificity.
		globalStyle(`${selector}${GATE_WITH_HAS ? `:where(:has(.${concentric}))` : ''}`, {
			'@layer': { [layer]: republish(reads, writes) },
		});
	}

	// Alternative for comparison only: the same alternation from a container style query, which
	// has no depth limit but only reached Firefox in version 151.
	const parity = createVar('concentric-parity');
	if (WITH_QUERY) {
		const odd = { ...rule(setA), vars: { ...republish(setA, setB).vars, [parity]: '1' } };
		const even = { ...rule(setB), vars: { ...republish(setB, setA).vars, [parity]: '2' } };
		globalStyle(`.${queried}`, { '@layer': { [layer]: odd } });
		globalStyle(`.${queried}`, {
			'@layer': { [layer]: { '@container': { [`style(${unwrap(parity)}: 1)`]: even } } },
		});
	}

	const borderRadius = config.config.borderRadius as Record<string, unknown>;
	config.config.borderRadius = {
		...borderRadius,
		staticScale: ['concentric', 'concentric-query'],
		values: { concentric: once(concentric), 'concentric-query': once(queried) },
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
