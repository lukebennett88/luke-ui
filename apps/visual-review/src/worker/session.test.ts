import { describe, expect, test } from 'vite-plus/test';
import { parseReturnPath, signToken, timingSafeEqual, verifyToken } from './session.js';

const SECRET = 'a-test-secret-that-is-32-bytes-long';
const NOW = 1_800_000_000;

describe('signed tokens', () => {
	test('verify with the same secret and purpose', async () => {
		const token = await signToken(SECRET, 'vr_session', { exp: NOW + 60, login: 'luke' });
		expect(await verifyToken(SECRET, 'vr_session', token, NOW)).toEqual({
			exp: NOW + 60,
			login: 'luke',
		});
	});

	test('reject a payload changed after signing', async () => {
		const token = await signToken(SECRET, 'vr_session', { exp: NOW + 60, login: 'luke' });
		const [, signature] = token.split('.');
		const forged = btoa(JSON.stringify({ exp: NOW + 60, login: 'admin' })).replace(/=+$/, '');
		expect(await verifyToken(SECRET, 'vr_session', `${forged}.${signature}`, NOW)).toBeUndefined();
	});

	test('reject a changed signature', async () => {
		const token = await signToken(SECRET, 'vr_session', { exp: NOW + 60 });
		const [body, signature = ''] = token.split('.');
		const tampered = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;
		expect(await verifyToken(SECRET, 'vr_session', `${body}.${tampered}`, NOW)).toBeUndefined();
	});

	test('reject another secret', async () => {
		const token = await signToken(SECRET, 'vr_session', { exp: NOW + 60 });
		expect(
			await verifyToken('another-secret-that-is-32-bytes-long', 'vr_session', token, NOW),
		).toBeUndefined();
	});

	test('reject a token signed for another cookie', async () => {
		const token = await signToken(SECRET, 'vr_login', { exp: NOW + 60 });
		expect(await verifyToken(SECRET, 'vr_session', token, NOW)).toBeUndefined();
	});

	test('reject an expired token', async () => {
		const token = await signToken(SECRET, 'vr_session', { exp: NOW });
		expect(await verifyToken(SECRET, 'vr_session', token, NOW)).toBeUndefined();
	});

	for (const token of ['', 'abc', 'a.b.c', '!!.!!']) {
		test(`reject the malformed token "${token}"`, async () => {
			expect(await verifyToken(SECRET, 'vr_session', token, NOW)).toBeUndefined();
		});
	}
});

describe('parseReturnPath', () => {
	test('defaults to the root', () => {
		expect(parseReturnPath(null)).toBe('/');
	});

	test('keeps a path with a query', () => {
		expect(parseReturnPath('/?pr=12&view=diff')).toBe('/?pr=12&view=diff');
	});

	for (const value of [
		'//evil.example',
		'/\\evil.example',
		'https://evil.example/',
		'evil',
		'/a\nb',
		`/${'a'.repeat(2048)}`,
	]) {
		test(`rejects ${JSON.stringify(value.slice(0, 24))}`, () => {
			expect(parseReturnPath(value)).toBeUndefined();
		});
	}
});

test('timingSafeEqual compares contents', () => {
	expect(timingSafeEqual('state-1', 'state-1')).toBe(true);
	expect(timingSafeEqual('state-1', 'state-2')).toBe(false);
	expect(timingSafeEqual('state', 'state-1')).toBe(false);
});
