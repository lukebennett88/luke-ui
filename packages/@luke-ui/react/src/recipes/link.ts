// Runtime re-export of the generated link recipe. The recipe definition
// lives in link.recipe.ts and is registered in panda.config.ts; variants
// added there flow through the generated types with no edit here.
import type { LinkVariantProps } from '../../styled-system/recipes/link.mjs';

export { link } from '../../styled-system/recipes/link.mjs';

// Recipe codegen without compound variants wraps every variant value in
// `ConditionalValue` (responsive arrays and condition objects). This recipe
// takes plain values only, so strip the wrapper back off for the public type.
export type LinkVariants = {
	[Key in keyof LinkVariantProps]?: Extract<LinkVariantProps[Key], string | number | boolean>;
};
