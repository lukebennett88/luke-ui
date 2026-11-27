import * as z from 'zod';
import { positiveIntegerSchema } from '../api/contract.js';
import { decodeBase64Url, encodeBase64Url } from './base64url.js';

/**
 * The `__Host-` prefix makes the browser refuse the cookie unless it is `Secure`, has `Path=/` and
 * no `Domain`. A `pr-<number>.<project>.pages.dev` deployment therefore cannot plant one for the
 * app's host.
 */
export const SESSION_COOKIE = '__Host-vr_session';
export const LOGIN_COOKIE = '__Host-vr_login';
export const SESSION_SECONDS = 8 * 60 * 60;
export const LOGIN_SECONDS = 10 * 60;

const LOGIN_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const MAX_RETURN_PATH_LENGTH = 2048;
// Control characters and backslashes: browsers read `/\host` as a protocol-relative URL.
const UNSAFE_PATH_CHARACTER_PATTERN = /[\p{Cc}\\]/u;

const encoder = new TextEncoder();

/** Every signed token carries its expiry, in seconds since the epoch. */
const expirySchema = z.object({ exp: z.number() });

/** The session cookie's payload. */
export const sessionSchema = expirySchema.extend({
	avatarUrl: z.string(),
	id: positiveIntegerSchema,
	login: z.string().regex(LOGIN_PATTERN),
});

export type Session = z.infer<typeof sessionSchema>;

/** The sign-in cookie's payload, from the start of sign-in to its callback. */
export const loginStateSchema = expirySchema.extend({
	return: z.string().refine((value) => parseReturnPath(value) === value),
	state: z.string(),
	verifier: z.string(),
});

function hmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ hash: 'SHA-256', name: 'HMAC' },
		false,
		['sign', 'verify'],
	);
}

/**
 * Signs a JSON payload with HMAC-SHA256 as `<payload>.<signature>`, both base64url. The cookie
 * name is part of the signed data, so a value signed for one cookie never verifies as another.
 */
export async function signToken(secret: string, purpose: string, payload: object): Promise<string> {
	const body = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
	const signature = await crypto.subtle.sign(
		'HMAC',
		await hmacKey(secret),
		encoder.encode(`${purpose}.${body}`),
	);
	return `${body}.${encodeBase64Url(new Uint8Array(signature))}`;
}

/**
 * Returns the payload of a token signed by `signToken` for `purpose`, read through `schema`, or
 * `undefined` when it is malformed, its signature does not verify, it does not match `schema`, or
 * its `exp` has passed.
 */
export async function verifyToken<T extends z.infer<typeof expirySchema>>(
	secret: string,
	purpose: string,
	token: string | undefined,
	nowSeconds: number,
	schema: z.ZodType<T>,
): Promise<T | undefined> {
	const [body, signatureText, ...rest] = token?.split('.') ?? [];
	if (body === undefined || signatureText === undefined || rest.length > 0) return undefined;
	const signature = decodeBase64Url(signatureText);
	const bytes = decodeBase64Url(body);
	if (!signature || !bytes) return undefined;
	// `subtle.verify` compares in constant time.
	const valid = await crypto.subtle.verify(
		'HMAC',
		await hmacKey(secret),
		signature,
		encoder.encode(`${purpose}.${body}`),
	);
	if (!valid) return undefined;
	let payload: unknown;
	try {
		payload = JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		return undefined;
	}
	const parsed = schema.safeParse(payload);
	if (!parsed.success || parsed.data.exp <= nowSeconds) return undefined;
	return parsed.data;
}

export function isLogin(value: string): boolean {
	return LOGIN_PATTERN.test(value);
}

/**
 * Validates the path to return to after sign-in. It must be a path on this origin: it starts with
 * `/`, not `//`, and has no backslash or control character. A missing value means `/`.
 */
export function parseReturnPath(value: string | null): string | undefined {
	if (value === null || value === '') return '/';
	if (value.length > MAX_RETURN_PATH_LENGTH) return undefined;
	if (!value.startsWith('/') || value.startsWith('//')) return undefined;
	if (UNSAFE_PATH_CHARACTER_PATTERN.test(value)) return undefined;
	return value;
}

/** Compares two strings in time that depends only on their lengths. */
export function timingSafeEqual(left: string, right: string): boolean {
	const a = encoder.encode(left);
	const b = encoder.encode(right);
	if (a.length !== b.length) return false;
	let difference = 0;
	for (let index = 0; index < a.length; index++) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
	return difference === 0;
}

/** A base64url string of `bytes` random bytes. */
export function randomToken(bytes = 32): string {
	return encodeBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** The PKCE S256 challenge for a verifier. */
export async function pkceChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
	return encodeBase64Url(new Uint8Array(digest));
}

export function readCookie(request: Request, name: string): string | undefined {
	for (const part of request.headers.get('Cookie')?.split(';') ?? []) {
		const separator = part.indexOf('=');
		if (separator !== -1 && part.slice(0, separator).trim() === name) {
			return part.slice(separator + 1).trim();
		}
	}
	return undefined;
}

/**
 * A host-only `HttpOnly; Secure` cookie on `/`, as its `__Host-` name requires. A `maxAge` of 0
 * clears it.
 */
function serializeCookie(
	name: string,
	value: string,
	maxAge: number,
	sameSite: 'Lax' | 'Strict',
): string {
	return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=${sameSite}`;
}

export function sessionCookie(value: string, maxAge = SESSION_SECONDS): string {
	return serializeCookie(SESSION_COOKIE, value, maxAge, 'Strict');
}

/** `Lax`, because GitHub's redirect to the callback is a cross-site navigation. */
export function loginCookie(value: string, maxAge = LOGIN_SECONDS): string {
	return serializeCookie(LOGIN_COOKIE, value, maxAge, 'Lax');
}
