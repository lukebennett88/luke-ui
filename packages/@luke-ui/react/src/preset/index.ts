import { lukeLayerOrder } from '../styles/layer-order.js';
import { buildPandaTokens } from '../theme/panda-tokens.js';

export { lukeLayerOrder };

/**
 * A copy-paste starting point for the first statement in a blessed consumer's global CSS.
 * Consumers extend this order with their own layers, but must retain every Luke UI layer.
 */
export const lukeLayerOrderStarter = `@layer ${lukeLayerOrder.join(', ')};`;

/**
 * Panda token aliases for consumers that import Luke UI's prebuilt stylesheet and theme CSS.
 * This supplies extraction metadata only; it does not include reset, global CSS, or recipes.
 */
export const lukePreset = {
	name: '@luke-ui/react',
	theme: { tokens: buildPandaTokens() },
};
