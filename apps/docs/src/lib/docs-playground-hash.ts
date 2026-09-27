import { encodeCodeHash } from '@luke-ui/playground-core/hash';
import { encodeShape } from './playground-editor-shape.js';

/**
 * Encodes code for a docs playground link. The `shape` param lets the
 * pre-hydration skeleton script mirror the shared code.
 */
export function encodeDocsPlaygroundHash(code: string): string {
	return encodeCodeHash(code, { shape: encodeShape(code) });
}
