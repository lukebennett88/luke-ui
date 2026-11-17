const BASE64URL_PATTERN = /^[\w-]*$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

/** Encodes bytes as unpadded base64url, the encoding JWTs and signed cookies use. */
export function encodeBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCodePoint(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Decodes unpadded base64url, or returns `undefined` when the text is not base64url. */
export function decodeBase64Url(text: string): Uint8Array<ArrayBuffer> | undefined {
	if (!BASE64URL_PATTERN.test(text)) return undefined;
	const base64 = text.replaceAll('-', '+').replaceAll('_', '/');
	return decodeBase64(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
}

/** Decodes padded standard base64, or returns `undefined` when the text is not base64. */
export function decodeBase64(text: string): Uint8Array<ArrayBuffer> | undefined {
	if (text.length % 4 !== 0 || !BASE64_PATTERN.test(text)) return undefined;
	const binary = atob(text);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) bytes[index] = binary.codePointAt(index) ?? 0;
	return bytes;
}
