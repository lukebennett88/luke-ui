import { expect, test } from 'vite-plus/test';
import { getActiveSiteDestination } from './site-destinations.js';

test('the docs destination covers every route the playground does not', () => {
	expect(getActiveSiteDestination('/')?.label).toBe('Docs');
	expect(getActiveSiteDestination('/components/actions/button')?.label).toBe('Docs');
	expect(getActiveSiteDestination('/theming')?.label).toBe('Docs');
});

test('the playground destination wins over the docs root it sits under', () => {
	expect(getActiveSiteDestination('/playground')?.label).toBe('Playground');
	expect(getActiveSiteDestination('/playground/preview')?.label).toBe('Playground');
});

test('a route that only shares a name prefix with a destination is not active', () => {
	expect(getActiveSiteDestination('/playgrounds')?.label).toBe('Docs');
});
