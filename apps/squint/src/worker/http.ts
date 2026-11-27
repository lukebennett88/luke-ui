import type { ErrorBody, ErrorCode } from '../api/contract.js';

/** A failure that becomes an `{ error, message }` response with its status. */
export class ApiError extends Error {
	readonly code: ErrorCode;
	readonly status: number;

	constructor(status: number, code: ErrorCode, message: string) {
		super(message);
		this.code = code;
		this.status = status;
	}
}

interface ResponseOptions {
	cacheControl?: string;
	cookies?: Array<string>;
	headers?: Record<string, string>;
	status?: number;
}

function apiHeaders({ cacheControl = 'no-store', cookies = [], headers = {} }: ResponseOptions) {
	const result = new Headers({
		'Cache-Control': cacheControl,
		// The callback URL carries the authorisation code, so no response leaks its URL onward.
		'Referrer-Policy': 'no-referrer',
		'X-Content-Type-Options': 'nosniff',
		...headers,
	});
	for (const cookie of cookies) result.append('Set-Cookie', cookie);
	return result;
}

export function json(body: unknown, options: ResponseOptions = {}): Response {
	const headers = apiHeaders(options);
	headers.set('Content-Type', 'application/json; charset=utf-8');
	return new Response(JSON.stringify(body), { headers, status: options.status ?? 200 });
}

export function redirect(location: string, cookies: Array<string>): Response {
	return new Response(null, {
		headers: apiHeaders({ cookies, headers: { Location: location } }),
		status: 302,
	});
}

export function noContent(cookies: Array<string>): Response {
	return new Response(null, { headers: apiHeaders({ cookies }), status: 204 });
}

export function errorResponse(error: unknown, options: ResponseOptions = {}): Response {
	const apiError =
		error instanceof ApiError ? error : new ApiError(500, 'internal', 'The request failed.');
	return json({ error: apiError.code, message: apiError.message } satisfies ErrorBody, {
		...options,
		status: apiError.status,
	});
}
