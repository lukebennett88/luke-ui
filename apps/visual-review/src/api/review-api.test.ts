import { expect, test } from 'vite-plus/test';
import { z } from 'zod';
import { loginHref, readApiResponse } from './review-api.js';

const schema = z.object({ ok: z.literal(true) });

function response(body: string, status: number, contentType = 'application/json; charset=utf-8') {
	return new Response(body, { headers: { 'Content-Type': contentType }, status });
}

test('reads a valid answer', async () => {
	expect(await readApiResponse(response('{"ok":true}', 200), schema)).toEqual({
		data: { ok: true },
		kind: 'ok',
	});
});

test('treats an HTML fallback and an unconfigured backend as no backend', async () => {
	expect(await readApiResponse(response('<!doctype html>', 200, 'text/html'), schema)).toEqual({
		kind: 'unavailable',
	});
	const unconfigured = response('{"error":"unconfigured","message":"Not here."}', 503);
	expect(await readApiResponse(unconfigured, schema)).toEqual({ kind: 'unavailable' });
});

test('reads the backend’s error code and message', async () => {
	const stale = response('{"error":"stale","message":"Reload the review."}', 409);
	expect(await readApiResponse(stale, schema)).toEqual({
		code: 'stale',
		kind: 'error',
		message: 'Reload the review.',
		status: 409,
	});
});

test('reports an answer that breaks the contract', async () => {
	expect(await readApiResponse(response('{"ok":false}', 200), schema)).toMatchObject({
		code: 'invalid-response',
		kind: 'error',
	});
});

test('sends sign-in back to the current page', () => {
	expect(loginHref('/?pr=12&capture=button/primary')).toBe(
		'/api/auth/login?return=%2F%3Fpr%3D12%26capture%3Dbutton%2Fprimary',
	);
});
