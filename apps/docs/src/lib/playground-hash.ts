// Default import + destructure because lz-string is CommonJS — named imports
// fail static analysis in Vite's SSR module runner.
import lzString from 'lz-string';
import { encodeShape } from './playground-shape';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = lzString;

const CODE_HASH_PARAM = 'code';
const SHAPE_PARAM = 'shape';

function getHashFragment(hash: string): string {
	const value = hash.trim();
	if (!value) return '';
	if (value.startsWith('#')) return value.slice(1);

	return value;
}

/** Returns the URL hash value (without the leading `#`) encoding the given code. */
export function encodeCodeHash(code: string): string {
	const params = new URLSearchParams({
		[CODE_HASH_PARAM]: compressToEncodedURIComponent(code),
		[SHAPE_PARAM]: encodeShape(code),
	});

	return params.toString();
}

/** Decodes playground code from a URL hash (with or without the leading `#`). */
export function decodeCodeHash(hash: string): string | null {
	const params = new URLSearchParams(getHashFragment(hash));
	const compressed = params.get(CODE_HASH_PARAM);
	if (!compressed) return null;

	const code = decompressFromEncodedURIComponent(compressed);
	return code || null;
}
