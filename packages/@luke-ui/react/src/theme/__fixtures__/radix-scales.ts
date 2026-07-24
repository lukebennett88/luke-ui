/**
 * Test-only Radix Colors reference scales and a hue stress-corpus for the scale generator.
 *
 * NOT imported by production code — these are reference *envelopes*, never generation targets. The
 * scale generator is calibrated to testable properties, and the Radix scales bound the expected
 * lightness/chroma ranges (per-step min/max across several families) that a well-formed Luke UI
 * family should fall inside. The corpus is a set of source colours that exercise the generator's
 * hard paths (dark-on-solid yellows, mid-neutrals, near-background accents, aggressive gamut
 * mappers, warm/cool neutrals).
 *
 * Values are the published Radix light/dark step hexes, converted to OKLCH with the same `color.ts`
 * math the generator uses so the envelope is expressed in the generator's own colour space.
 */

import type { Oklch } from '../color.js';
import { parseColor } from '../color.js';

/** A Radix 12-step scale as published hex values, step 1 through step 12. */
interface RadixScaleHex {
	/** The Radix family name. */
	name: string;
	/** The colour mode the scale is authored for. */
	mode: 'light' | 'dark';
	/** The 12 step hex values, step 1 (app background) through step 12 (high-contrast text). */
	steps: readonly [
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
	];
}

/** Radix light-mode reference scales spanning neutral, cool, warm, and light-solid hues. */
const RADIX_LIGHT_SCALES: ReadonlyArray<RadixScaleHex> = [
	{
		mode: 'light',
		name: 'slate',
		steps: [
			'#fbfcfd',
			'#f8f9fa',
			'#f1f3f5',
			'#eceef0',
			'#e6e8eb',
			'#dfe3e6',
			'#d7dbdf',
			'#c1c8cd',
			'#889096',
			'#7e868c',
			'#687076',
			'#11181c',
		],
	},
	{
		mode: 'light',
		name: 'blue',
		steps: [
			'#fbfdff',
			'#f4faff',
			'#e6f4fe',
			'#d5efff',
			'#c2e5ff',
			'#acd8fc',
			'#8ec8f6',
			'#5eb1ef',
			'#0090ff',
			'#0588f0',
			'#0d74ce',
			'#113264',
		],
	},
	{
		mode: 'light',
		name: 'red',
		steps: [
			'#fffcfc',
			'#fff7f7',
			'#feebec',
			'#ffdbdc',
			'#ffcdce',
			'#fdbdbe',
			'#f4a9aa',
			'#eb8e90',
			'#e5484d',
			'#dc3e42',
			'#ce2c31',
			'#641723',
		],
	},
	{
		mode: 'light',
		name: 'grass',
		steps: [
			'#fbfefb',
			'#f5fbf5',
			'#e9f6e9',
			'#daf1db',
			'#c9e8ca',
			'#b2ddb5',
			'#94ce9a',
			'#65ba74',
			'#46a758',
			'#3e9b4f',
			'#2a7e3b',
			'#203c25',
		],
	},
	{
		mode: 'light',
		name: 'amber',
		steps: [
			'#fefdfb',
			'#fefbe9',
			'#fff7c2',
			'#ffee9c',
			'#fbe577',
			'#f3d673',
			'#e9c162',
			'#e2a336',
			'#ffc53d',
			'#ffba18',
			'#ab6400',
			'#4f3422',
		],
	},
	{
		mode: 'light',
		name: 'purple',
		steps: [
			'#fefcfe',
			'#fbf7fe',
			'#f7edfe',
			'#f2e2fc',
			'#ead5f9',
			'#e0c4f4',
			'#d1afec',
			'#be93e4',
			'#8e4ec6',
			'#8347b9',
			'#8145b5',
			'#402060',
		],
	},
];

/** Radix dark-mode reference scales. */
const RADIX_DARK_SCALES: ReadonlyArray<RadixScaleHex> = [
	{
		mode: 'dark',
		name: 'slate',
		steps: [
			'#111113',
			'#18191b',
			'#212225',
			'#272a2d',
			'#2e3135',
			'#363a3f',
			'#43484e',
			'#5a6169',
			'#696e77',
			'#777b84',
			'#b0b4ba',
			'#edeef0',
		],
	},
	{
		mode: 'dark',
		name: 'blue',
		steps: [
			'#0d1520',
			'#111927',
			'#0d2847',
			'#003362',
			'#004074',
			'#104d87',
			'#205d9e',
			'#2870bd',
			'#0090ff',
			'#3b9eff',
			'#70b8ff',
			'#c2e6ff',
		],
	},
	{
		mode: 'dark',
		name: 'red',
		steps: [
			'#191111',
			'#201314',
			'#3b1219',
			'#500f1c',
			'#611623',
			'#72232d',
			'#8c333a',
			'#b54548',
			'#e5484d',
			'#ec5d5e',
			'#ff9592',
			'#ffd1d9',
		],
	},
	{
		mode: 'dark',
		name: 'grass',
		steps: [
			'#0e1511',
			'#141a15',
			'#1b2a1e',
			'#1d3a24',
			'#25482d',
			'#2d5736',
			'#366740',
			'#3e7949',
			'#46a758',
			'#53b365',
			'#71d083',
			'#c2f0c2',
		],
	},
];

/** A Radix scale converted to the generator's OKLCH space, step 1 through step 12. */
export interface RadixScaleOklch {
	name: string;
	mode: 'light' | 'dark';
	steps: Array<Oklch>;
}

/** Converts a hex scale to OKLCH using the generator's own colour math. */
function toOklchScale(scale: RadixScaleHex): RadixScaleOklch {
	return { mode: scale.mode, name: scale.name, steps: scale.steps.map((hex) => parseColor(hex)) };
}

/** The light reference scales in OKLCH. */
export const RADIX_LIGHT_OKLCH: ReadonlyArray<RadixScaleOklch> =
	RADIX_LIGHT_SCALES.map(toOklchScale);

/** The dark reference scales in OKLCH. */
export const RADIX_DARK_OKLCH: ReadonlyArray<RadixScaleOklch> = RADIX_DARK_SCALES.map(toOklchScale);

/** Per-step [min, max] lightness across a set of scales — the reference envelope for a mode. */
export function lightnessEnvelope(scales: ReadonlyArray<RadixScaleOklch>): Array<[number, number]> {
	return envelope(scales, (step) => step.l);
}

/** Per-step [min, max] chroma across a set of scales — the reference chroma envelope for a mode. */
export function chromaEnvelope(scales: ReadonlyArray<RadixScaleOklch>): Array<[number, number]> {
	return envelope(scales, (step) => step.c);
}

function envelope(
	scales: ReadonlyArray<RadixScaleOklch>,
	select: (step: Oklch) => number,
): Array<[number, number]> {
	return Array.from({ length: 12 }, (_unused, index) => {
		const values = scales
			.map((scale) => scale.steps[index])
			.filter((step): step is Oklch => step !== undefined)
			.map(select);
		return [Math.min(...values), Math.max(...values)] as [number, number];
	});
}

/** A source colour that exercises a hard path in the generator. */
export interface CorpusEntry {
	/** A short label for the case. */
	name: string;
	/** The source colour, as any string `parseColor` accepts. */
	source: string;
	/** Why this case is interesting for the generator. */
	note: string;
}

/**
 * The hue stress-corpus: source colours that push the generator's solid-anchor search, gamut
 * mapping, and on-solid choice. Used as `source` (and, for neutrals, `background`) inputs — not as
 * scales to reproduce. Every entry generates cleanly for a vibrant role (their tone sits clear of
 * the on-solid dead zone); the genuinely-unsatisfiable dead-zone cases live in
 * {@link UNSATISFIABLE_ON_SOLID}.
 */
export const HUE_STRESS_CORPUS: ReadonlyArray<CorpusEntry> = [
	{
		name: 'saturated-red',
		note: 'vibrant warm; takes near-white on-solid',
		source: 'oklch(0.53 0.22 27)',
	},
	{
		name: 'saturated-blue',
		note: 'vibrant cool; takes near-white on-solid',
		source: 'oklch(0.5 0.2 258)',
	},
	{
		name: 'saturated-green',
		note: 'vibrant; on-solid can flip near the band',
		source: 'oklch(0.51 0.19 150)',
	},
	{ name: 'saturated-purple', note: 'vibrant; deep hue', source: 'oklch(0.48 0.24 300)' },
	{
		name: 'bright-yellow',
		note: 'light solid; needs near-black on-solid',
		source: 'oklch(0.86 0.19 100)',
	},
	{ name: 'lime', note: 'light solid; needs near-black on-solid', source: 'oklch(0.85 0.2 130)' },
	{ name: 'mint', note: 'light solid; needs near-black on-solid', source: 'oklch(0.88 0.13 165)' },
	{
		name: 'near-background-accent',
		note: 'very light accent near the light canvas',
		source: 'oklch(0.92 0.06 250)',
	},
	{
		name: 'aggressive-cyan',
		note: 'chroma far outside sRGB; heavy gamut mapping',
		source: 'oklch(0.7 0.4 195)',
	},
	{
		name: 'aggressive-magenta',
		note: 'chroma far outside sRGB; heavy gamut mapping',
		source: 'oklch(0.55 0.45 330)',
	},
	{
		name: 'warm-neutral',
		note: 'warm-tinted neutral canvas character',
		source: 'oklch(0.5 0.02 70)',
	},
	{
		name: 'cool-neutral',
		note: 'cool-tinted neutral canvas character',
		source: 'oklch(0.5 0.02 250)',
	},
];

/**
 * Dead-zone sources: mid-lightness colours where neither near-white nor near-black on-solid text
 * clears AA across the solid and its hover, and whose authored tone the generator preserves. A
 * `needsOnSolid` role given one of these is genuinely unsatisfiable and throws.
 */
export const UNSATISFIABLE_ON_SOLID: Record<'light' | 'dark', CorpusEntry> = {
	dark: {
		name: 'dead-zone-blue-dark',
		note: 'mid lightness; whole tone window is a dead zone',
		source: 'oklch(0.55 0.2 258)',
	},
	light: {
		name: 'dead-zone-red-light',
		note: 'mid lightness; whole tone window is a dead zone',
		source: 'oklch(0.62 0.19 27)',
	},
};
