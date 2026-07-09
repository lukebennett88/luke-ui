// Default import + destructure because lz-string is CommonJS — named imports
// fail static analysis in Vite's SSR module runner.
import lzString from 'lz-string';
import { encodeShape } from './playground-shape';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = lzString;

const CODE_HASH_PREFIX = 'code=';
const SHAPE_PARAM_PREFIX = 'shape=';

/** Returns the URL hash value (without the leading `#`) encoding the given code. */
export function encodeCodeHash(code: string): string {
	const compressed = compressToEncodedURIComponent(code);
	return `${CODE_HASH_PREFIX}${compressed}&${SHAPE_PARAM_PREFIX}${encodeShape(code)}`;
}

/** Decodes playground code from a URL hash (with or without the leading `#`). */
export function decodeCodeHash(hash: string): string | null {
	const value = hash.startsWith('#') ? hash.slice(1) : hash;
	if (!value.startsWith(CODE_HASH_PREFIX)) return null;
	const payload = value.slice(CODE_HASH_PREFIX.length);
	const paramsStart = payload.indexOf('&');
	const compressed = paramsStart === -1 ? payload : payload.slice(0, paramsStart);
	const code = decompressFromEncodedURIComponent(compressed);
	return code || null;
}
