import * as stylex from '@stylexjs/stylex';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { createContext, createElement, useContext } from 'react';
import { styleProps } from './merge.js';

// A layout-focused Box: spacing, flex layout, radius, border width, and paired backgrounds. Values are
// set inline through StyleX dynamic styles, so the stylesheet holds one rule per property and
// condition instead of a generated table per token (#547).

// StyleX orders `@media` rules by width but sorts `@container` rules as strings, which puts
// `>= 1536px` before `>= 640px`. Overlapping mobile-first conditions would then resolve to whichever
// sorts last, so each breakpoint is an exclusive range and `dyn()` carries values forward.
const bp640 = '@container (640px <= inline-size < 768px)';
const bp768 = '@container (768px <= inline-size < 1024px)';
const bp1024 = '@container (1024px <= inline-size < 1280px)';
const bp1280 = '@container (1280px <= inline-size < 1536px)';
const bp1536 = '@container (inline-size >= 1536px)';

type Breakpoint = 'initial' | 'bp640' | 'bp768' | 'bp1024' | 'bp1280' | 'bp1536';
/** A value, or one value per breakpoint. Larger breakpoints inherit from smaller ones. */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

type Space = '0' | `space.${4 | 8 | 12 | 16 | 24 | 32 | 40 | 48 | 64 | 96}`;
type Radius = 'none' | 'detail' | 'control' | 'surface' | 'overlay' | 'full' | 'concentric';
type BorderWidth = 'none' | 'thin' | 'thick';
type Background =
	| 'surface.base'
	| 'surface.raised'
	| 'surface.subdued'
	| 'accent.solid'
	| 'neutral.subtle'
	| 'danger.solid';

// Each Box that has geometry publishes it on one of two property sets, alternating with nesting
// depth. A child reads the other set, so publishing its own geometry never references a property
// it also declares, which would be a cycle.
type Parity = 'a' | 'b';
const ParityContext = createContext<Parity | null>(null);

const corners = ['ss', 'se', 'es', 'ee'] as const;
// Which insets each logical corner subtracts: [inline edge, block edge].
const cornerInsets = {
	ee: ['ie', 'be'],
	es: ['is', 'be'],
	se: ['ie', 'bs'],
	ss: ['is', 'bs'],
} as const;

const v = (parity: Parity, name: string) => `--luke-internal-concentric-${parity}-${name}`;

// Corner radii, inner radii, and the published names, for one parity. Written as an expression so
// StyleX can evaluate it at build time.
const geometry = (own: Parity, parent: Parity, concentric: boolean) => ({
	borderStartStartRadius: `var(${v(own, 'outer-ss-h')}) var(${v(own, 'outer-ss-v')})`,
	borderStartEndRadius: `var(${v(own, 'outer-se-h')}) var(${v(own, 'outer-se-v')})`,
	borderEndStartRadius: `var(${v(own, 'outer-es-h')}) var(${v(own, 'outer-es-v')})`,
	borderEndEndRadius: `var(${v(own, 'outer-ee-h')}) var(${v(own, 'outer-ee-v')})`,
	...Object.fromEntries(
		corners.flatMap((corner) => [
			[
				`--luke-internal-concentric-${own}-outer-${corner}-h`,
				concentric ? `var(${v(parent, `${corner}-h`)}, 0px)` : `var(${v(own, 'radius')})`,
			],
			[
				`--luke-internal-concentric-${own}-outer-${corner}-v`,
				concentric ? `var(${v(parent, `${corner}-v`)}, 0px)` : `var(${v(own, 'radius')})`,
			],
			[
				`--luke-internal-concentric-${own}-${corner}-h`,
				`max(0px, var(${v(own, `outer-${corner}-h`)}) - var(${v(own, cornerInsets[corner][0])}))`,
			],
			[
				`--luke-internal-concentric-${own}-${corner}-v`,
				`max(0px, var(${v(own, `outer-${corner}-v`)}) - var(${v(own, cornerInsets[corner][1])}))`,
			],
		]),
	),
});

// Dynamic styles must be arrow function literals inside `stylex.create`: a factory that returns one
// is rejected ("A StyleX namespace must be an object"), so each property is spelled out twice.
//
// StyleX 0.19.1 mishandles a dynamic condition whose value is null. For `paddingBlock*`, which it
// rewrites to physical `padding-top` and `padding-bottom`, it applies the condition's class anyway,
// so the property computes to its initial value at that breakpoint. For other properties it
// concatenates `"null"` into the class string. A plain value therefore uses `single`, and a
// responsive value passes all six conditions with each breakpoint carried forward.
const single = stylex.create({
	display: (value: string) => ({ display: value }),
	flexDirection: (value: string) => ({ flexDirection: value }),
	gap: (value: string) => ({ gap: value }),
	paddingBlockStart: (value: string) => ({ paddingBlockStart: value }),
	paddingBlockEnd: (value: string) => ({ paddingBlockEnd: value }),
	paddingInlineStart: (value: string) => ({ paddingInlineStart: value }),
	paddingInlineEnd: (value: string) => ({ paddingInlineEnd: value }),
	insetABs: (value: string) => ({ '--luke-internal-concentric-a-bs': value }),
	insetABe: (value: string) => ({ '--luke-internal-concentric-a-be': value }),
	insetAIs: (value: string) => ({ '--luke-internal-concentric-a-is': value }),
	insetAIe: (value: string) => ({ '--luke-internal-concentric-a-ie': value }),
	radiusA: (value: string) => ({ '--luke-internal-concentric-a-radius': value }),
	insetBBs: (value: string) => ({ '--luke-internal-concentric-b-bs': value }),
	insetBBe: (value: string) => ({ '--luke-internal-concentric-b-be': value }),
	insetBIs: (value: string) => ({ '--luke-internal-concentric-b-is': value }),
	insetBIe: (value: string) => ({ '--luke-internal-concentric-b-ie': value }),
	radiusB: (value: string) => ({ '--luke-internal-concentric-b-radius': value }),
});

const responsive = stylex.create({
	display: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		display: { default: a, [bp640]: b, [bp768]: c, [bp1024]: d, [bp1280]: e, [bp1536]: f },
	}),
	flexDirection: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		flexDirection: { default: a, [bp640]: b, [bp768]: c, [bp1024]: d, [bp1280]: e, [bp1536]: f },
	}),
	gap: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		gap: { default: a, [bp640]: b, [bp768]: c, [bp1024]: d, [bp1280]: e, [bp1536]: f },
	}),
	paddingBlockStart: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		paddingBlockStart: {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	paddingBlockEnd: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		paddingBlockEnd: { default: a, [bp640]: b, [bp768]: c, [bp1024]: d, [bp1280]: e, [bp1536]: f },
	}),
	paddingInlineStart: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		paddingInlineStart: {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	paddingInlineEnd: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		paddingInlineEnd: { default: a, [bp640]: b, [bp768]: c, [bp1024]: d, [bp1280]: e, [bp1536]: f },
	}),
	insetABs: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-a-bs': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetABe: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-a-be': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetAIs: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-a-is': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetAIe: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-a-ie': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	radiusA: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-a-radius': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetBBs: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-b-bs': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetBBe: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-b-be': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetBIs: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-b-is': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	insetBIe: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-b-ie': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
	radiusB: (a: string, b: string, c: string, d: string, e: string, f: string) => ({
		'--luke-internal-concentric-b-radius': {
			default: a,
			[bp640]: b,
			[bp768]: c,
			[bp1024]: d,
			[bp1280]: e,
			[bp1536]: f,
		},
	}),
});

const pairing = (background: string, foreground: string, solid: boolean) => ({
	backgroundColor: background,
	color: foreground,
	'--luke-internal-foreground-primary': solid ? foreground : 'initial',
	'--luke-internal-foreground-secondary': solid ? foreground : 'initial',
	'--luke-internal-foreground-tone': solid ? foreground : 'initial',
	'--luke-internal-focus': solid ? foreground : 'initial',
	'--luke-internal-surface-fill-rest': background,
	'--luke-internal-surface-fill-hover': solid
		? background.replace('-rest)', '-hover)')
		: 'var(--luke-interaction-tint-hover)',
	'--luke-internal-surface-fill-pressed': solid
		? background.replace('-rest)', '-pressed)')
		: 'var(--luke-interaction-tint-pressed)',
	'--luke-internal-surface-finish-hover': solid ? 'var(--luke-control-finish-raised)' : 'initial',
	'--luke-internal-surface-finish-pressed': solid
		? 'var(--luke-control-finish-recessed), var(--luke-control-finish-recessed)'
		: 'initial',
	'--luke-internal-surface-shadow-pressed': solid
		? 'var(--luke-shadow-inset), var(--luke-shadow-inset), var(--luke-shadow-inset)'
		: 'initial',
});

const styles = stylex.create({
	base: { minInlineSize: 0 },
	geometryA: geometry('a', 'b', false),
	geometryB: geometry('b', 'a', false),
	concentricA: geometry('a', 'b', true),
	concentricB: geometry('b', 'a', true),
	// Width, style, and colour are separate props, as in the Vanilla Extract Box.
	borderNone: { borderWidth: 0 },
	borderThin: { borderWidth: '1px' },
	borderThick: { borderWidth: '2px' },
	styleSolid: { borderStyle: 'solid' },
	styleNone: { borderStyle: 'none' },
	colorDecorative: { borderColor: 'var(--luke-color-border-decorative)' },
	colorControl: { borderColor: 'var(--luke-color-border-control-rest)' },
	'surface.base': pairing(
		'var(--luke-color-background-surface-base)',
		'var(--luke-color-foreground-primary)',
		false,
	),
	'surface.raised': pairing(
		'var(--luke-color-background-surface-raised)',
		'var(--luke-color-foreground-primary)',
		false,
	),
	'surface.subdued': pairing(
		'var(--luke-color-background-surface-subdued)',
		'var(--luke-color-foreground-primary)',
		false,
	),
	'neutral.subtle': pairing(
		'var(--luke-color-background-neutral-subtle)',
		'var(--luke-color-foreground-primary)',
		false,
	),
	'accent.solid': pairing(
		'var(--luke-color-background-accent-solid-rest)',
		'var(--luke-color-foreground-accent-on-solid)',
		true,
	),
	'danger.solid': pairing(
		'var(--luke-color-background-danger-solid-rest)',
		'var(--luke-color-foreground-danger-on-solid)',
		true,
	),
});

const spaceValue = (value: Space) =>
	value === '0' ? '0px' : `var(--luke-${value.replace('.', '-')})`;
const radiusValue = (value: Radius) => (value === 'none' ? '0px' : `var(--luke-radius-${value})`);
const borderValue = { none: '0px', thick: '2px', thin: '1px' } as const;
const breakpoints: ReadonlyArray<Breakpoint> = [
	'initial',
	'bp640',
	'bp768',
	'bp1024',
	'bp1280',
	'bp1536',
];

function isResponsive<T>(value: Responsive<T>): value is Partial<Record<Breakpoint, T>> {
	return typeof value === 'object' && value !== null;
}

type DynamicName = keyof typeof single;

/** One dynamic style for a plain or responsive value. Larger breakpoints inherit smaller ones. */
function dyn<T>(
	name: DynamicName,
	value: Responsive<T>,
	map: (value: T) => string,
	fallback: string,
) {
	if (!isResponsive(value)) return single[name](map(value));
	let carried = value.initial === undefined ? fallback : map(value.initial);
	const values = breakpoints.map((breakpoint) => {
		const entry = value[breakpoint];
		if (entry !== undefined) carried = map(entry);
		return carried;
	}) as [string, string, string, string, string, string];
	return responsive[name](...values);
}

/** Props for `Box`. */
export interface BoxProps {
	alignItems?: CSSProperties['alignItems'];
	backgroundColor?: Background;
	borderRadius?: Responsive<Radius>;
	borderColor?: 'control' | 'decorative';
	borderStyle?: 'none' | 'solid';
	borderWidth?: BorderWidth;
	children?: ReactNode;
	className?: string;
	display?: Responsive<'block' | 'flex' | 'grid' | 'inline-flex' | 'none'>;
	elementType?: string;
	flexDirection?: Responsive<'row' | 'column'>;
	gap?: Responsive<Space>;
	id?: string;
	justifyContent?: CSSProperties['justifyContent'];
	padding?: Responsive<Space>;
	paddingBlock?: Responsive<Space>;
	paddingBlockEnd?: Responsive<Space>;
	paddingBlockStart?: Responsive<Space>;
	paddingInline?: Responsive<Space>;
	paddingInlineEnd?: Responsive<Space>;
	paddingInlineStart?: Responsive<Space>;
	style?: CSSProperties;
	'data-testid'?: string;
}

/** Resolves `padding` shorthands to the four logical longhands. A side beats an axis beats all. */
function resolvePadding(props: BoxProps) {
	return {
		be: props.paddingBlockEnd ?? props.paddingBlock ?? props.padding,
		bs: props.paddingBlockStart ?? props.paddingBlock ?? props.padding,
		ie: props.paddingInlineEnd ?? props.paddingInline ?? props.padding,
		is: props.paddingInlineStart ?? props.paddingInline ?? props.padding,
	};
}

/** Layout primitive. `borderRadius="concentric"` derives each corner from the parent Box's geometry. */
export function Box(props: BoxProps): JSX.Element {
	const parentParity = useContext(ParityContext);
	const {
		backgroundColor,
		borderRadius,
		borderWidth,
		children,
		className,
		elementType = 'div',
		style,
	} = props;
	const padding = resolvePadding(props);
	const hasPadding = Object.values(padding).some((value) => value !== undefined);
	const hasGeometry = borderRadius !== undefined || hasPadding || borderWidth !== undefined;
	const own: Parity = parentParity === 'a' ? 'b' : 'a';
	const border = borderValue[borderWidth ?? 'none'];
	const inset = (name: DynamicName, side: Responsive<Space> | undefined) =>
		dyn(
			name,
			side ?? '0',
			(value: Space) => `calc(${spaceValue(value)} + ${border})`,
			`calc(0px + ${border})`,
		);
	const isConcentric = borderRadius === 'concentric';

	const resolved = styleProps(
		[
			styles.base,
			props.display !== undefined && dyn('display', props.display, String, 'block'),
			props.flexDirection !== undefined && dyn('flexDirection', props.flexDirection, String, 'row'),
			props.gap !== undefined && dyn('gap', props.gap, spaceValue, '0px'),
			padding.bs !== undefined && dyn('paddingBlockStart', padding.bs, spaceValue, '0px'),
			padding.be !== undefined && dyn('paddingBlockEnd', padding.be, spaceValue, '0px'),
			padding.is !== undefined && dyn('paddingInlineStart', padding.is, spaceValue, '0px'),
			padding.ie !== undefined && dyn('paddingInlineEnd', padding.ie, spaceValue, '0px'),
			borderWidth === 'thin' && styles.borderThin,
			borderWidth === 'thick' && styles.borderThick,
			borderWidth === 'none' && styles.borderNone,
			props.borderStyle === 'solid' && styles.styleSolid,
			props.borderStyle === 'none' && styles.styleNone,
			props.borderColor === 'decorative' && styles.colorDecorative,
			props.borderColor === 'control' && styles.colorControl,
			backgroundColor !== undefined && styles[backgroundColor],
			hasGeometry &&
				own === 'a' && [
					isConcentric ? styles.concentricA : styles.geometryA,
					inset('insetABs', padding.bs),
					inset('insetABe', padding.be),
					inset('insetAIs', padding.is),
					inset('insetAIe', padding.ie),
					!isConcentric &&
						dyn(
							'radiusA',
							borderRadius ?? 'none',
							(value) => (value === 'concentric' ? '0px' : radiusValue(value)),
							'0px',
						),
				],
			hasGeometry &&
				own === 'b' && [
					isConcentric ? styles.concentricB : styles.geometryB,
					inset('insetBBs', padding.bs),
					inset('insetBBe', padding.be),
					inset('insetBIs', padding.is),
					inset('insetBIe', padding.ie),
					!isConcentric &&
						dyn(
							'radiusB',
							borderRadius ?? 'none',
							(value) => (value === 'concentric' ? '0px' : radiusValue(value)),
							'0px',
						),
				],
		],
		className,
		{ alignItems: props.alignItems, justifyContent: props.justifyContent, ...style },
	);
	const element = createElement(
		elementType,
		{ ...resolved, 'data-testid': props['data-testid'], id: props.id },
		children,
	);
	// A Box without geometry passes the nearest geometry through unchanged.
	if (!hasGeometry) return element;
	return <ParityContext value={own}>{element}</ParityContext>;
}
