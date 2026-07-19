// Runtime re-export of the generated icon recipe. The recipe definition
// lives in icon.recipe.ts and is registered in panda.config.ts; variants
// added there flow through the generated types with no edit here.
import type { IconVariantProps } from '../../styled-system/recipes/icon.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

export { icon } from '../../styled-system/recipes/icon.mjs';

// See PlainVariants for why the generated variant props need unwrapping.
export type IconVariants = PlainVariants<IconVariantProps>;
