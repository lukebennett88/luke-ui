// Default import + destructure because lz-string is CommonJS — named imports
// fail static analysis in Vite's SSR module runner.
import lzString from 'lz-string';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = lzString;

const CODE_HASH_PARAM = 'code';

/**
 * Returns the URL hash value (without the leading `#`) encoding the given code.
 *
 * `extraParams` are appended after `code` in insertion order, so a host can
 * carry its own data, such as a loading-skeleton shape, in the same hash.
 */
export function encodeCodeHash(code: string, extraParams?: Record<string, string>): string {
	const params = new URLSearchParams();
	params.set(CODE_HASH_PARAM, compressToEncodedURIComponent(code));
	for (const [name, value] of Object.entries(extraParams ?? {})) {
		if (name === CODE_HASH_PARAM) {
			throw new Error(`encodeCodeHash: '${CODE_HASH_PARAM}' is reserved for the encoded code.`);
		}
		params.append(name, value);
	}

	return params.toString();
}

/**
 * Decodes playground code from a URL hash (with or without the leading `#`).
 * Returns `null` when the hash has no `code` param, or when the param cannot
 * be decoded back into code, including malformed input that makes `lz-string`
 * throw instead of returning `null` (see the `lz-string` version this repo
 * installs). `encodeCodeHash('')` still round-trips to `''`, because it
 * compresses empty code to the non-empty string `'Q'`.
 */
export function decodeCodeHash(hash: string): string | null {
	const params = new URLSearchParams(getHashFragment(hash));
	const compressed = params.get(CODE_HASH_PARAM);
	if (compressed === null) return null;

	try {
		return decompressFromEncodedURIComponent(compressed);
	} catch {
		// lz-string throws on some malformed input instead of returning null.
		return null;
	}
}

function getHashFragment(hash: string): string {
	const value = hash.trim();
	if (!value) return '';
	if (value.startsWith('#')) return value.slice(1);

	return value;
}
