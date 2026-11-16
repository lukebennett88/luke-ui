import { expect, test } from 'vite-plus/test';
import { decodeBase64Url } from './base64url.js';
import { createAppJwt, importPrivateKey } from './github.js';
import { generateTestKey } from './test-key.js';

const { pem, publicKey } = await generateTestKey();

function decodeJson(part: string | undefined): unknown {
	return JSON.parse(new TextDecoder().decode(decodeBase64Url(part ?? '')));
}

test('createAppJwt signs an RS256 JWT that GitHub accepts for ten minutes', async () => {
	const jwt = await createAppJwt(await importPrivateKey(pem), 42, 1_800_000_000);
	const [header, payload, signature] = jwt.split('.');

	expect(decodeJson(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
	expect(decodeJson(payload)).toEqual({ exp: 1_800_000_540, iat: 1_799_999_940, iss: '42' });
	const verified = await crypto.subtle.verify(
		'RSASSA-PKCS1-v1_5',
		publicKey,
		decodeBase64Url(signature ?? '') ?? new Uint8Array(),
		new TextEncoder().encode(`${header}.${payload}`),
	);
	expect(verified).toBe(true);
});

test('importPrivateKey reads a PEM pasted with escaped newlines', async () => {
	const key = await importPrivateKey(pem.replaceAll('\n', String.raw`\n`));
	expect(key.algorithm.name).toBe('RSASSA-PKCS1-v1_5');
});
