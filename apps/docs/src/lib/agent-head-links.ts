import { withBasePath } from './base-path.js';

/** A `<link>` tag's relevant attributes, as passed to TanStack Router's `head()`. */
export interface AgentHeadLink {
	href: string;
	rel: string;
	type?: string;
}

/**
 * The `<link>` tags that point an agent from an HTML page to its Markdown
 * twin: `rel="alternate"` names the twin itself, and `rel="describedby"`
 * points at the site's `/llms.txt` index, per the llms.txt v2 proposal
 * (https://github.com/AnswerDotAI/llms-txt). `markdownPath` is already
 * base-prefixed, matching `PageActions`' `markdownUrl`; `basePath` is
 * `import.meta.env.BASE_URL`, used to prefix the `llms.txt` link to match.
 */
export function agentHeadLinks(markdownPath: string, basePath: string): Array<AgentHeadLink> {
	return [
		{ href: markdownPath, rel: 'alternate', type: 'text/markdown' },
		{ href: withBasePath('/llms.txt', basePath), rel: 'describedby' },
	];
}
