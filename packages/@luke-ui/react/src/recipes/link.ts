// Runtime re-export of the generated link recipe. The recipe definition lives
// in link.recipe.ts and is registered in panda.config.ts; variants added there
// flow through the generated types with no edit here.
import type { LinkVariantProps } from '../../styled-system/recipes/link.mjs';
import { link as pandaLink } from '../../styled-system/recipes/link.mjs';

// Recipe codegen wraps non-compound variant values in ConditionalValue. Link
// accepts plain variant values, so keep its existing public contract narrow.
export type LinkVariants = {
	[Key in keyof LinkVariantProps]?: Extract<LinkVariantProps[Key], string | number | boolean>;
};

export const link = pandaLink as unknown as (variants?: LinkVariants) => string;
