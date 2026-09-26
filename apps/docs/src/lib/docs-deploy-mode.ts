/**
 * Docs production builds support two hosts that need different prerender and
 * server-function behaviour. Do not key this off `import.meta.env.PROD` — both
 * modes are production builds.
 *
 * - `ssr` (default): Netlify. HTML docs stay runtime SSR so theme cookies can
 *   vary the first paint. Docs loaders use normal `createServerFn` calls.
 * - `static`: GitHub Pages–style. HTML docs are prerendered and
 *   `staticFunctionMiddleware` caches loader results under
 *   `__tsr/staticServerFnCache`.
 *
 * Set `DOCS_STATIC=true` (or `1`) for the static mode. Leave it unset for SSR.
 */
export type DocsDeployMode = 'ssr' | 'static';

const STATIC_ENV_VALUES = new Set(['1', 'true']);

export function readDocsDeployMode(
	env: Record<string, string | undefined> = process.env,
): DocsDeployMode {
	const value = env.DOCS_STATIC?.trim().toLowerCase();
	return value && STATIC_ENV_VALUES.has(value) ? 'static' : 'ssr';
}

export function isDocsStaticDeploy(env: Record<string, string | undefined> = process.env): boolean {
	return readDocsDeployMode(env) === 'static';
}
