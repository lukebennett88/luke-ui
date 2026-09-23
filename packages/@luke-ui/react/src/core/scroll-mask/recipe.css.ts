import type { StyleRule } from '@vanilla-extract/css';
import { createVar, keyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Adaptive mask depth: a fraction of the scrollport, capped at `sp40`. */
const maskSize = `min(12%, ${vars.space.sp40})`;

/** Scroll distance over which each edge fade eases in or out. */
const revealDistance = vars.space.sp96;

const startFadeVar = createVar({
	inherits: false,
	initialValue: '0px',
	syntax: '<length-percentage>',
});

const endFadeVar = createVar({
	inherits: false,
	initialValue: '0px',
	syntax: '<length-percentage>',
});

const revealStartFade = keyframes({
	from: { vars: { [startFadeVar]: '0px' } },
	to: { vars: { [startFadeVar]: maskSize } },
});

const revealEndFade = keyframes({
	from: { vars: { [endFadeVar]: maskSize } },
	to: { vars: { [endFadeVar]: '0px' } },
});

/** Physical gradient angles. Degrees stay unambiguous in Chromium's computed `mask-image`. */
const maskAngle = {
	bottom: 180,
	left: 270,
	right: 90,
	top: 0,
} as const;

function overflowingMask(timeline: 'scroll(self inline)' | 'scroll(self block)'): StyleRule {
	// Scroll-driven properties are newer than the StyleRule surface; cast the support block.
	return {
		'@supports': {
			'(animation-timeline: scroll())': {
				animationDuration: '1ms',
				animationFillMode: 'both',
				animationName: `${revealStartFade}, ${revealEndFade}`,
				animationRange: `0 ${revealDistance}, calc(100% - ${revealDistance}) 100%`,
				animationTimeline: `${timeline}, ${timeline}`,
				animationTimingFunction: 'linear',
			} as StyleRule,
		},
	};
}

function maskGradient(side: keyof typeof maskAngle): string {
	return `linear-gradient(${String(maskAngle[side])}deg, transparent 0, #000 ${startFadeVar}, #000 calc(100% - ${endFadeVar}), transparent 100%)`;
}

/**
 * Writing-mode token on the scrollport. Direction is not stored here — `:dir(rtl)` flips inline
 * ends in CSS so inherited direction changes apply without JS.
 *
 * `:not(:focus-visible)` keeps Luke UI's standard outline unmasked while the scrollport is
 * keyboard-focused.
 */
function writingModeMasks(
	rules: Record<string, { ltr: keyof typeof maskAngle; rtl?: keyof typeof maskAngle }>,
): StyleRule['selectors'] {
	const selectors: NonNullable<StyleRule['selectors']> = {};
	for (const [writing, { ltr, rtl }] of Object.entries(rules)) {
		const base = `&[data-scroll-mask-writing="${writing}"]:not(:focus-visible)`;
		selectors[base] = { maskImage: maskGradient(ltr) };
		if (rtl !== undefined) {
			selectors[`${base}:dir(rtl)`] = { maskImage: maskGradient(rtl) };
		}
	}
	return selectors;
}

/** Recipe for ScrollMask layout. Overflow/mask state is not a public recipe variant. */
export const scrollMaskRecipe = recipe({
	base: {
		// Min size 0 so the scrollport can shrink inside flex/grid parents.
		minBlockSize: 0,
		minInlineSize: 0,
	},
	defaultVariants: {
		axis: 'inline',
	},
	variants: {
		axis: {
			block: {
				overflowBlock: 'auto',
				overflowInline: 'hidden',
			},
			inline: {
				overflowBlock: 'hidden',
				overflowInline: 'auto',
			},
		},
	},
});

/** Variant type for the public `ScrollMask` recipe. */
export type ScrollMaskRecipeVariants = RecipeSelection<typeof scrollMaskRecipe>;

/**
 * Private overflowing styles for `axis="inline"`. Physical mask ends follow writing mode; `:dir(rtl)`
 * reverses inline ends where direction flips them.
 */
export const scrollMaskOverflowingInline = style({
	...overflowingMask('scroll(self inline)'),
	selectors: writingModeMasks({
		'horizontal-tb': { ltr: 'right', rtl: 'left' },
		// Vertical scripts: LTR inline progresses top → bottom; RTL flips to top.
		'vertical-rl': { ltr: 'bottom', rtl: 'top' },
		'vertical-lr': { ltr: 'bottom', rtl: 'top' },
		'sideways-rl': { ltr: 'bottom', rtl: 'top' },
		// sideways-lr inverts inline progression relative to vertical-lr.
		'sideways-lr': { ltr: 'top', rtl: 'bottom' },
	}),
});

/**
 * Private overflowing styles for `axis="block"`. Block-end depends on writing mode only — direction
 * does not flip the block axis.
 */
export const scrollMaskOverflowingBlock = style({
	...overflowingMask('scroll(self block)'),
	selectors: writingModeMasks({
		'horizontal-tb': { ltr: 'bottom' },
		'vertical-rl': { ltr: 'left' },
		'vertical-lr': { ltr: 'right' },
		'sideways-rl': { ltr: 'left' },
		'sideways-lr': { ltr: 'right' },
	}),
});

/** Angles used in overflowing mask gradients — shared with browser assertions. */
export const scrollMaskGradientAngle = maskAngle;
