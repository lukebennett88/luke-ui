import { describe, expect, it } from 'vitest';
import { rewritePackageDocLinks } from '../../lib/rewrite-package-doc-links.js';

describe('rewritePackageDocLinks', () => {
	it('rewrites ./other.md to the hosted URL using the supplied map', () => {
		const slugMap = new Map([['text', '/docs/components/typography/text']]);
		const md = '[Text](./text.md)';
		const out = rewritePackageDocLinks(md, slugMap);
		expect(out).toBe('[Text](/docs/components/typography/text)');
	});

	it('leaves external URLs untouched', () => {
		const slugMap = new Map([['text', '/docs/components/typography/text']]);
		const md = '[RAC](https://react-spectrum.adobe.com/...)';
		expect(rewritePackageDocLinks(md, slugMap)).toBe(md);
	});

	it('leaves anchor-only links untouched', () => {
		const slugMap: Map<string, string> = new Map();
		const md = 'See [the Variants section](#variants).';
		expect(rewritePackageDocLinks(md, slugMap)).toBe(md);
	});
});
