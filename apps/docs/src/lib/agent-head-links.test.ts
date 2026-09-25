import { expect, test } from 'vite-plus/test';
import { agentHeadLinks } from './agent-head-links.js';

test('builds the alternate and describedby links at the root base path', () => {
	expect(agentHeadLinks('/index.md', '/')).toEqual([
		{ href: '/index.md', rel: 'alternate', type: 'text/markdown' },
		{ href: '/llms.txt', rel: 'describedby' },
	]);
});

test('base-prefixes the describedby link under a sub-path base, keeping the already-prefixed markdown link as-is', () => {
	expect(agentHeadLinks('/luke-ui/docs/installation.md', '/luke-ui/')).toEqual([
		{ href: '/luke-ui/docs/installation.md', rel: 'alternate', type: 'text/markdown' },
		{ href: '/luke-ui/llms.txt', rel: 'describedby' },
	]);
});
