import { expect, test } from 'vite-plus/test';
import { getActiveSiteDestination } from './site-destinations.js';

test('the landing page has no active destination', () => {
	expect(getActiveSiteDestination('/')).toBeUndefined();
});

test('the docs destination covers /docs and its nested pages', () => {
	expect(getActiveSiteDestination('/docs')?.label).toBe('Docs');
	expect(getActiveSiteDestination('/docs/installation')?.label).toBe('Docs');
	expect(getActiveSiteDestination('/docs/theming')?.label).toBe('Docs');
});

test('the components destination wins over pages nested under it', () => {
	expect(getActiveSiteDestination('/components')?.label).toBe('Components');
	expect(getActiveSiteDestination('/components/actions/button')?.label).toBe('Components');
	expect(getActiveSiteDestination('/components/primitives/field/props')?.label).toBe('Components');
});

test('the playground destination covers its nested pages', () => {
	expect(getActiveSiteDestination('/playground')?.label).toBe('Playground');
	expect(getActiveSiteDestination('/playground/preview')?.label).toBe('Playground');
});

test('a route that only shares a name prefix with a destination is not active', () => {
	expect(getActiveSiteDestination('/playgrounds')).toBeUndefined();
	expect(getActiveSiteDestination('/component')).toBeUndefined();
	expect(getActiveSiteDestination('/docsify')).toBeUndefined();
	expect(getActiveSiteDestination('/documentation')).toBeUndefined();
});
