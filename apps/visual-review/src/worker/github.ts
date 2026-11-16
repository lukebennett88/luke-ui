import { z } from 'zod';
import { decodeBase64, encodeBase64Url } from './base64url.js';
import type { Config } from './config.js';
import { ApiError } from './http.js';

const GITHUB_API = 'https://api.github.com';
export const USER_AGENT = 'luke-ui-visual-review';

/** Refresh an installation token this long before GitHub expires it. */
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const JWT_BACKDATE_SECONDS = 60;
const JWT_LIFETIME_SECONDS = 9 * 60;

const encoder = new TextEncoder();

export interface Deps {
	fetch: typeof fetch;
	/** Milliseconds since the epoch. */
	now: () => number;
	/** Cloudflare's edge cache, when the runtime has one. */
	cache?: ResponseCache;
}

/** The part of the Cache API the worker uses. */
export interface ResponseCache {
	match: (request: Request) => Promise<Response | undefined>;
	put: (request: Request, response: Response) => Promise<void>;
}

interface RequestOptions {
	body?: unknown;
	method?: 'GET' | 'PATCH' | 'POST';
	token: string;
}

/** Calls the GitHub REST or GraphQL API. A network failure becomes a 502. */
export async function githubFetch(
	deps: Deps,
	path: string,
	{ body, method = 'GET', token }: RequestOptions,
): Promise<Response> {
	const headers = new Headers({
		Accept: 'application/vnd.github+json',
		Authorization: `Bearer ${token}`,
		'User-Agent': USER_AGENT,
		'X-GitHub-Api-Version': '2022-11-28',
	});
	if (body !== undefined) headers.set('Content-Type', 'application/json');
	try {
		return await deps.fetch(`${GITHUB_API}${path}`, {
			body: body === undefined ? undefined : JSON.stringify(body),
			headers,
			method,
		});
	} catch {
		throw upstream(`GitHub could not be reached for ${describe(method, path)}.`);
	}
}

/** Reads a successful GitHub response through a schema. Anything else becomes a 502. */
export async function readGitHubJson<T>(
	response: Response,
	schema: z.ZodType<T>,
	what: string,
): Promise<T> {
	if (!response.ok) throw upstream(`GitHub answered ${response.status} for ${what}.`);
	const parsed = schema.safeParse(await response.json().catch(() => undefined));
	if (!parsed.success) throw upstream(`GitHub sent an unexpected ${what}.`);
	return parsed.data;
}

export function upstream(message: string): ApiError {
	return new ApiError(502, 'upstream', message);
}

function describe(method: string, path: string): string {
	return `${method} ${path.split('?')[0]}`;
}

/** Imports a PKCS#8 PEM RSA key for RS256 signing. */
export async function importPrivateKey(pem: string): Promise<CryptoKey> {
	const base64 = pem
		.replaceAll(/-----(?:BEGIN|END) PRIVATE KEY-----/g, '')
		// A secret pasted with escaped newlines still decodes.
		.replaceAll(String.raw`\n`, '')
		.replaceAll(/\s/g, '');
	const der = decodeBase64(base64);
	if (!der) throw new TypeError('The private key is not base64 PEM.');
	return crypto.subtle.importKey(
		'pkcs8',
		der,
		{ hash: 'SHA-256', name: 'RSASSA-PKCS1-v1_5' },
		false,
		['sign'],
	);
}

/**
 * Signs the RS256 JWT a GitHub App authenticates as itself with. It is backdated a minute for
 * clock drift and expires within GitHub's ten-minute limit.
 */
export async function createAppJwt(
	key: CryptoKey,
	appId: number,
	nowSeconds: number,
): Promise<string> {
	const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
	const payload = encodeJson({
		exp: nowSeconds + JWT_LIFETIME_SECONDS,
		iat: nowSeconds - JWT_BACKDATE_SECONDS,
		iss: String(appId),
	});
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		key,
		encoder.encode(`${header}.${payload}`),
	);
	return `${header}.${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

function encodeJson(value: object): string {
	return encodeBase64Url(encoder.encode(JSON.stringify(value)));
}

const installationSchema = z.object({ id: z.number().int().positive() });
const accessTokenSchema = z.object({ expires_at: z.string(), token: z.string().min(1) });
const appSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) });

export interface GitHubApp {
	/** The App's slug, which names its bot account `<slug>[bot]`. */
	appSlug: (config: Config) => Promise<string>;
	/** A token for the App's installation on the repository, scoped to that repository. */
	installationToken: (config: Config) => Promise<string>;
}

/**
 * Authenticates as the GitHub App. The imported key, the installation token and the slug live in
 * this closure, which the worker keeps for the isolate's lifetime.
 */
export function createGitHubApp(deps: Deps): GitHubApp {
	let key: { pem: string; promise: Promise<CryptoKey> } | undefined;
	let token: { cacheKey: string; refreshAt: number; value: string } | undefined;
	let slug: { appId: number; value: string } | undefined;

	async function appJwt(config: Config): Promise<string> {
		if (key?.pem !== config.privateKey) {
			key = { pem: config.privateKey, promise: importPrivateKey(config.privateKey) };
		}
		let cryptoKey: CryptoKey;
		try {
			cryptoKey = await key.promise;
		} catch {
			key = undefined;
			throw new ApiError(503, 'unconfigured', 'The GitHub App private key is not PKCS#8 RSA.');
		}
		return createAppJwt(cryptoKey, config.appId, Math.floor(deps.now() / 1000));
	}

	return {
		async appSlug(config) {
			if (slug?.appId === config.appId) return slug.value;
			const app = await readGitHubJson(
				await githubFetch(deps, '/app', { token: await appJwt(config) }),
				appSchema,
				'app',
			);
			slug = { appId: config.appId, value: app.slug };
			return app.slug;
		},

		async installationToken(config) {
			const cacheKey = `${config.appId}:${config.repository}`;
			if (token?.cacheKey === cacheKey && deps.now() < token.refreshAt) return token.value;
			const jwt = await appJwt(config);
			const installation = await readGitHubJson(
				await githubFetch(deps, `/repos/${config.repository}/installation`, { token: jwt }),
				installationSchema,
				'installation',
			);
			const created = await readGitHubJson(
				await githubFetch(deps, `/app/installations/${installation.id}/access_tokens`, {
					body: {
						permissions: { checks: 'write', metadata: 'read', pull_requests: 'write' },
						repositories: [config.repositoryName],
					},
					method: 'POST',
					token: jwt,
				}),
				accessTokenSchema,
				'installation token',
			);
			const expiresAt = Date.parse(created.expires_at);
			token = {
				cacheKey,
				refreshAt: Number.isNaN(expiresAt) ? 0 : expiresAt - TOKEN_REFRESH_MARGIN_MS,
				value: created.token,
			};
			return created.token;
		},
	};
}
