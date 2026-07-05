import { describe, expect, it } from 'vite-plus/test';
import { withBasePath } from './markdown-url';

describe('markdown-url', () => {
	it('keeps docs markdown URLs on the same public route under a base path', () => {
		expect(withBasePath('/docs/components/actions/button.md', '/luke-ui/')).toBe(
			'/luke-ui/docs/components/actions/button.md',
		);
	});
});
