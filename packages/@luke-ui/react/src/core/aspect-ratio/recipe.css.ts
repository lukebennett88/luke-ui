import { globalStyleInLayer, style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Custom property that supplies `object-fit` for the direct media child. */
const aspectRatioObjectFitVar = '--luke-aspect-ratio-object-fit';

/**
 * The single-cell grid the `ratio` variants size. It is a `style()` class so the child rule below
 * has a selector to hang off: a `recipe()` style can only target the element itself.
 */
const mediaFrameClassName = style(
	{
		display: 'grid',
		vars: {
			[aspectRatioObjectFitVar]: 'cover',
		},
	},
	'aspectRatioMediaFrame',
);

// A media element keeps its intrinsic size in a grid cell, so size the direct child to the frame
// rather than relying on stretch alignment. `object-fit` then decides how replaced media paints
// inside that filled box — no frame overflow clipping required.
globalStyleInLayer('structural', `${mediaFrameClassName} > *`, {
	blockSize: '100%',
	inlineSize: '100%',
	minBlockSize: 0,
	minInlineSize: 0,
	objectFit: `var(${aspectRatioObjectFitVar})` as 'cover',
});

/** Recipe for a media frame locked to an inline-to-block ratio. */
export const aspectRatioRecipe = recipe({
	base: mediaFrameClassName,
	defaultVariants: {
		objectFit: 'cover',
		ratio: '1 / 1',
	},
	variants: {
		objectFit: {
			contain: { vars: { [aspectRatioObjectFitVar]: 'contain' } },
			cover: { vars: { [aspectRatioObjectFitVar]: 'cover' } },
			fill: { vars: { [aspectRatioObjectFitVar]: 'fill' } },
			none: { vars: { [aspectRatioObjectFitVar]: 'none' } },
			'scale-down': { vars: { [aspectRatioObjectFitVar]: 'scale-down' } },
		},
		ratio: {
			'1 / 1': { aspectRatio: '1 / 1' },
			'3 / 2': { aspectRatio: '3 / 2' },
			'4 / 3': { aspectRatio: '4 / 3' },
			'16 / 9': { aspectRatio: '16 / 9' },
			'21 / 9': { aspectRatio: '21 / 9' },
		},
	},
});

/** Variant type for the `AspectRatio` recipe. */
export type AspectRatioRecipeVariants = RecipeSelection<typeof aspectRatioRecipe>;
