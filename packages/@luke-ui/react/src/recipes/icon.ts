// Runtime re-export of the generated icon recipe. The recipe definition
// lives in icon.recipe.ts and is registered in panda.config.ts; variants
// added there flow through the generated types with no edit here.
import type { IconVariantProps } from '../../styled-system/recipes/icon.mjs';

export { icon } from '../../styled-system/recipes/icon.mjs';

// Recipe codegen without compound variants wraps every variant value in
// `ConditionalValue` (responsive arrays and condition objects). This recipe
// takes plain values only, so strip the wrapper back off for the public type.
export type IconVariants = {
	[Key in keyof IconVariantProps]?: Extract<IconVariantProps[Key], string | number | boolean>;
};
