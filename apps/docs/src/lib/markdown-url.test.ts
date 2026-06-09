import { describe, expect, it } from 'vitest';
import { mapPublicToInternal, withBasePath } from './markdown-url';

describe('markdown-url', () => {
	it('keeps docs markdown URLs on the same public route under a base path', () => {
		expect(withBasePath('/docs/components/actions/button.md', '/luke-ui/')).toBe(
			'/luke-ui/docs/components/actions/button.md',
		);
	});

	it('rewrites base-prefixed docs markdown URLs to the internal renderer route', () => {
		expect(mapPublicToInternal('/luke-ui/docs/components/actions/button.md', '/luke-ui/')).toBe(
			'/markdown/components/actions/button',
		);
	});
});
