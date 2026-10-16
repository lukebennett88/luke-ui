import { expect, test } from 'vite-plus/test';
import { withBasePath } from './base-path.js';

test('withBasePath leaves root-relative paths unchanged at the site root', () => {
	expect(withBasePath('/type-definitions/abc.json', '/')).toBe('/type-definitions/abc.json');
	expect(withBasePath('/type-definitions/abc.json', '')).toBe('/type-definitions/abc.json');
});

test('withBasePath prefixes assets when docs deploy under a subpath', () => {
	expect(withBasePath('/type-definitions/abc.json', '/luke-ui/')).toBe(
		'/luke-ui/type-definitions/abc.json',
	);
	expect(withBasePath('/type-definitions/abc.json', '/luke-ui')).toBe(
		'/luke-ui/type-definitions/abc.json',
	);
});
