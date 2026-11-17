/** Generates an RSA key pair for tests, with the private key as the PKCS#8 PEM GitHub needs. */
export async function generateTestKey(): Promise<{ pem: string; publicKey: CryptoKey }> {
	const pair = await crypto.subtle.generateKey(
		{
			hash: 'SHA-256',
			modulusLength: 2048,
			name: 'RSASSA-PKCS1-v1_5',
			publicExponent: new Uint8Array([1, 0, 1]),
		},
		true,
		['sign', 'verify'],
	);
	const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
	let binary = '';
	for (const byte of der) binary += String.fromCodePoint(byte);
	const lines = btoa(binary).match(/.{1,64}/g) ?? [];
	return {
		pem: `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`,
		publicKey: pair.publicKey,
	};
}
