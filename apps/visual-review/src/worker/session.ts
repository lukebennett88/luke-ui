import { decodeBase64Url, encodeBase64Url } from './base64url.js';

export const SESSION_COOKIE = 'vr_session';
export const LOGIN_COOKIE = 'vr_login';
export const SESSION_SECONDS = 8 * 60 * 60;
export const LOGIN_SECONDS = 10 * 60;

const LOGIN_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const MAX_RETURN_PATH_LENGTH = 2048;
// Control characters and backslashes: browsers read `/\host` as a protocol-relative URL.
const UNSAFE_PATH_CHARACTERS = /[\p{Cc}\\]/u;

const encoder = new TextEncoder();

export interface Session {
	avatarUrl: string;
	exp: number;
	id: number;
	login: string;
}

export interface LoginState {
	exp: number;
	return: string;
	state: string;
	verifier: string;
}

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
 * Returns the payload of a token signed by `signToken` for `purpose`, or `undefined` when it is
 * malformed, its signature does not verify, or its numeric `exp` (seconds) has passed.
 */
export async function verifyToken(
	secret: string,
	purpose: string,
	token: string | undefined,
	nowSeconds: number,
): Promise<Record<string, unknown> | undefined> {
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
	if (typeof payload !== 'object' || payload === null) return undefined;
	const { exp } = payload as { exp?: unknown };
	if (typeof exp !== 'number' || exp <= nowSeconds) return undefined;
	return payload as Record<string, unknown>;
}

export function parseSession(payload: Record<string, unknown> | undefined): Session | undefined {
	if (!payload) return undefined;
	const { avatarUrl, exp, id, login } = payload;
	if (typeof login !== 'string' || !isLogin(login)) return undefined;
	if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return undefined;
	if (typeof avatarUrl !== 'string' || typeof exp !== 'number') return undefined;
	return { avatarUrl, exp, id, login };
}

export function parseLoginState(
	payload: Record<string, unknown> | undefined,
): LoginState | undefined {
	if (!payload) return undefined;
	const { exp, return: returnPath, state, verifier } = payload;
	if (typeof state !== 'string' || typeof verifier !== 'string') return undefined;
	if (typeof returnPath !== 'string' || parseReturnPath(returnPath) !== returnPath)
		return undefined;
	if (typeof exp !== 'number') return undefined;
	return { exp, return: returnPath, state, verifier };
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
	if (UNSAFE_PATH_CHARACTERS.test(value)) return undefined;
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

interface CookieOptions {
	maxAge: number;
	path: string;
	sameSite: 'Lax' | 'Strict';
}

/** A host-only `HttpOnly; Secure` cookie. A `maxAge` of 0 clears it. */
function serializeCookie(name: string, value: string, options: CookieOptions): string {
	return `${name}=${value}; Max-Age=${options.maxAge}; Path=${options.path}; HttpOnly; Secure; SameSite=${options.sameSite}`;
}

export function sessionCookie(value: string, maxAge = SESSION_SECONDS): string {
	return serializeCookie(SESSION_COOKIE, value, { maxAge, path: '/', sameSite: 'Strict' });
}

export function loginCookie(value: string, maxAge = LOGIN_SECONDS): string {
	return serializeCookie(LOGIN_COOKIE, value, { maxAge, path: '/api/auth', sameSite: 'Lax' });
}
