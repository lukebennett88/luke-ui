/** Pages environment bindings. Every value except `ASSETS` is a production secret or variable. */
export interface Env {
	/** Pages' static asset binding. `_routes.json` sends only `/api/*` to the worker. */
	ASSETS?: { fetch: (request: Request) => Promise<Response> };
	APP_ORIGIN?: string;
	GITHUB_APP_CLIENT_ID?: string;
	GITHUB_APP_CLIENT_SECRET?: string;
	GITHUB_APP_ID?: string;
	GITHUB_APP_PRIVATE_KEY?: string;
	GITHUB_REPOSITORY?: string;
	SESSION_SECRET?: string;
}

export interface Config {
	appId: number;
	/** The app's `https` origin, with no trailing slash. */
	appOrigin: string;
	clientId: string;
	clientSecret: string;
	/** PKCS#8 PEM. */
	privateKey: string;
	/** `owner/name`. */
	repository: string;
	/** The repository's name without its owner. */
	repositoryName: string;
	sessionSecret: string;
}

const APP_ID_PATTERN = /^[1-9]\d{0,15}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9-]+\/([\w.-]+)$/;
const PKCS8_HEADER = '-----BEGIN PRIVATE KEY-----';
const MINIMUM_SESSION_SECRET_BYTES = 32;

/**
 * Reads the bindings into a validated configuration, or returns `undefined` when any is missing or
 * malformed. Preview deployments have no secrets, so they answer every route as unconfigured.
 */
export function readConfig(env: Env): Config | undefined {
	const {
		APP_ORIGIN: appOrigin,
		GITHUB_APP_CLIENT_ID: clientId,
		GITHUB_APP_CLIENT_SECRET: clientSecret,
		GITHUB_APP_ID: appId,
		GITHUB_APP_PRIVATE_KEY: privateKey,
		GITHUB_REPOSITORY: repository,
		SESSION_SECRET: sessionSecret,
	} = env;
	if (!appId || !APP_ID_PATTERN.test(appId)) return undefined;
	if (!clientId || !clientSecret) return undefined;
	if (!privateKey?.includes(PKCS8_HEADER)) return undefined;
	if (
		!sessionSecret ||
		new TextEncoder().encode(sessionSecret).length < MINIMUM_SESSION_SECRET_BYTES
	) {
		return undefined;
	}
	const repositoryName = repository ? REPOSITORY_PATTERN.exec(repository)?.[1] : undefined;
	if (!repository || !repositoryName) return undefined;
	if (!appOrigin || !isHttpsOrigin(appOrigin)) return undefined;
	return {
		appId: Number(appId),
		appOrigin,
		clientId,
		clientSecret,
		privateKey,
		repository,
		repositoryName,
		sessionSecret,
	};
}

function isHttpsOrigin(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.origin === value;
	} catch {
		return false;
	}
}
