import type { FontWeightRole, TypeStyle } from '../../theme/type-styles.js';
import type { HeadingLevel } from './heading-context.js';

/**
 * The type style each heading level resolves to. `Heading` uses it for its default, and `Prose`
 * uses it for plain `h1`–`h6`, so the two cannot drift. A plain module so a `.css.ts` file can
 * import it.
 */
export const headingTypographyByLevel = {
	1: 'heading1',
	2: 'heading2',
	3: 'heading3',
	4: 'heading4',
	// h5/h6 stay in the outline without inventing heading5/heading6 type styles.
	5: 'lead',
	6: 'body',
} as const satisfies Record<HeadingLevel, TypeStyle>;

/** The weight role a `Heading` uses unless `fontWeight` says otherwise. */
export const headingDefaultFontWeight = 'heading' as const satisfies FontWeightRole;
