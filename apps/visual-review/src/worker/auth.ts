import { z } from 'zod';
import type { Context } from './access.js';
import { assertSameOrigin, nowSeconds, readSession, reviewerLogin } from './access.js';
import { githubFetch, readGitHubJson, upstream, USER_AGENT } from './github.js';
import { ApiError, errorResponse, json, noContent, redirect } from './http.js';
import {
	isLogin,
	LOGIN_COOKIE,
	LOGIN_SECONDS,
	loginCookie,
	parseLoginState,
	parseReturnPath,
	pkceChallenge,
	randomToken,
	readCookie,
	SESSION_COOKIE,
	SESSION_SECONDS,
	sessionCookie,
	signToken,
	timingSafeEqual,
	verifyToken,
} from './session.js';

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const CODE_PATTERN = /^[\w-]{1,256}$/;

const tokenSchema = z.object({ access_token: z.string().min(1) });
const userSchema = z.object({
	avatar_url: z.url({ protocol: /^https$/ }),
	id: z.number().int().positive(),
	login: z.string().refine(isLogin),
});

function callbackUrl(context: Context): string {
	return `${context.config.appOrigin}/api/auth/callback`;
}

/** `GET /api/auth/login`: starts GitHub's web flow with PKCE and a `state`. */
export async function login(context: Context): Promise<Response> {
	const returnPath = parseReturnPath(context.url.searchParams.get('return'));
	if (!returnPath)
		throw new ApiError(400, 'invalid', 'The return path must be a path on this site.');
	const state = randomToken();
	const verifier = randomToken();
	const cookie = await signToken(context.config.sessionSecret, LOGIN_COOKIE, {
		exp: nowSeconds(context) + LOGIN_SECONDS,
		return: returnPath,
		state,
		verifier,
	});
	const authorize = new URL(AUTHORIZE_URL);
	authorize.search = new URLSearchParams({
		allow_signup: 'false',
		client_id: context.config.clientId,
		code_challenge: await pkceChallenge(verifier),
		code_challenge_method: 'S256',
		redirect_uri: callbackUrl(context),
		state,
	}).toString();
	return redirect(authorize.toString(), [loginCookie(cookie)]);
}

/**
 * `GET /api/auth/callback`: checks `state`, exchanges the code with the PKCE verifier, reads who
 * signed in and starts a session. The user token is used once and never stored.
 */
export async function callback(context: Context): Promise<Response> {
	const clearLogin = loginCookie('', 0);
	try {
		const stored = parseLoginState(
			await verifyToken(
				context.config.sessionSecret,
				LOGIN_COOKIE,
				readCookie(context.request, LOGIN_COOKIE),
				nowSeconds(context),
			),
		);
		const state = context.url.searchParams.get('state');
		const code = context.url.searchParams.get('code');
		if (!stored || !state || !timingSafeEqual(state, stored.state)) {
			throw new ApiError(400, 'invalid', 'The sign-in expired or did not start here. Try again.');
		}
		if (!code || !CODE_PATTERN.test(code)) {
			throw new ApiError(400, 'invalid', 'GitHub did not complete the sign-in.');
		}
		const userToken = await exchangeCode(context, code, stored.verifier);
		const user = await readGitHubJson(
			await githubFetch(context.deps, '/user', { token: userToken }),
			userSchema,
			'user',
		);
		const sessionValue = await signToken(context.config.sessionSecret, SESSION_COOKIE, {
			avatarUrl: user.avatar_url,
			exp: nowSeconds(context) + SESSION_SECONDS,
			id: user.id,
			login: user.login,
		});
		return redirect(`${context.config.appOrigin}${stored.return}`, [
			clearLogin,
			sessionCookie(sessionValue),
		]);
	} catch (error) {
		return errorResponse(error, { cookies: [clearLogin] });
	}
}

async function exchangeCode(context: Context, code: string, verifier: string): Promise<string> {
	let response: Response;
	try {
		response = await context.deps.fetch(TOKEN_URL, {
			body: JSON.stringify({
				client_id: context.config.clientId,
				client_secret: context.config.clientSecret,
				code,
				code_verifier: verifier,
				redirect_uri: callbackUrl(context),
			}),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': USER_AGENT,
			},
			method: 'POST',
		});
	} catch {
		throw upstream('GitHub could not be reached to finish the sign-in.');
	}
	if (!response.ok) throw upstream(`GitHub answered ${response.status} to the code exchange.`);
	// GitHub reports a rejected code as a 200 with an `error` field.
	const parsed = tokenSchema.safeParse(await response.json().catch(() => undefined));
	if (!parsed.success) throw new ApiError(400, 'invalid', 'GitHub did not accept the sign-in.');
	return parsed.data.access_token;
}

/** `POST /api/auth/logout`: clears the session. */
export function logout(context: Context): Response {
	assertSameOrigin(context);
	return noContent([sessionCookie('', 0)]);
}

/** `GET /api/session`: who is signed in, and whether they can review. */
export async function session(context: Context): Promise<Response> {
	const current = await readSession(context);
	if (!current) {
		const hasCookie = readCookie(context.request, SESSION_COOKIE) !== undefined;
		return json({ user: null }, { cookies: hasCookie ? [sessionCookie('', 0)] : [] });
	}
	return json({
		canReview: (await reviewerLogin(context, current)) !== undefined,
		user: { avatarUrl: current.avatarUrl, login: current.login },
	});
}
