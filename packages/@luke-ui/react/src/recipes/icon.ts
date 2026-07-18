// Runtime re-export of the generated icon recipe. The recipe definition lives
// in icon.recipe.ts and is registered in panda.config.ts; variants added there
// flow through the generated types with no edit here.
import type { IconVariantProps } from '../../styled-system/recipes/icon.mjs';
import { icon as pandaIcon } from '../../styled-system/recipes/icon.mjs';

// Recipe codegen wraps non-compound variant values in ConditionalValue. Icon
// accepts plain size values, so keep its existing public contract narrow.
export type IconVariants = {
	[Key in keyof IconVariantProps]?: Extract<IconVariantProps[Key], string | number | boolean>;
};

export const icon = pandaIcon as unknown as (variants?: IconVariants) => string;
