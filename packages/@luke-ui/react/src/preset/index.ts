import { lukeLayerOrder } from '../styles/layer-order.js';

export { lukeLayerOrder };

/**
 * A copy-paste starting point for the first statement in a blessed consumer's global CSS.
 * Consumers extend this order with their own layers, but must retain every Luke UI layer.
 */
export const lukeLayerOrderStarter = `@layer ${lukeLayerOrder.join(', ')};`;
