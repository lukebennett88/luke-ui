// Runtime re-export of the generated link recipe. The recipe definition
// lives in link.recipe.ts and is registered in panda.config.ts; variants
// added there flow through the generated types with no edit here.
import type { LinkVariantProps } from '../../styled-system/recipes/link.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

export { link } from '../../styled-system/recipes/link.mjs';

// See PlainVariants for why the generated variant props need unwrapping.
export type LinkVariants = PlainVariants<LinkVariantProps>;
