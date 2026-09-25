/**
 * Netlify adapter for `agent-negotiation.ts`'s host-agnostic logic. A
 * different host would need only a similarly small adapter of its own.
 */
import { handleRequest } from '../../src/lib/agent-negotiation.ts';

/** Minimal local shape of Netlify's edge function `Context`. */
interface Context {
	next: (request?: Request) => Promise<Response>;
}

/** Minimal local shape of Netlify's edge function `Config`. */
interface Config {
	excludedPath?: Array<string> | string;
	path: Array<string> | string;
}

export const config: Config = {
	excludedPath: ['/assets/*', '/api/*'],
	path: '/*',
};

export default (request: Request, context: Context): Promise<Response> => {
	return handleRequest(request, {
		fetch: (url) => fetch(url),
		next: (req) => (req ? context.next(req) : context.next()),
	});
};
