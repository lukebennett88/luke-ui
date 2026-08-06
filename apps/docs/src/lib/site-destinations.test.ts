import { expect, test } from 'vite-plus/test';
import { getActiveSiteDestination } from './site-destinations.js';

test('the docs destination covers the routes no other destination claims', () => {
	expect(getActiveSiteDestination('/')?.label).toBe('Getting started');
	expect(getActiveSiteDestination('/theming')?.label).toBe('Getting started');
});

test('the components destination wins over the docs root it sits under', () => {
	expect(getActiveSiteDestination('/components')?.label).toBe('Components');
	expect(getActiveSiteDestination('/components/actions/button')?.label).toBe('Components');
	expect(getActiveSiteDestination('/components/primitives/field/props')?.label).toBe('Components');
});

test('the playground destination wins over the docs root it sits under', () => {
	expect(getActiveSiteDestination('/playground')?.label).toBe('Playground');
	expect(getActiveSiteDestination('/playground/preview')?.label).toBe('Playground');
});

test('a route that only shares a name prefix with a destination is not active', () => {
	expect(getActiveSiteDestination('/playgrounds')?.label).toBe('Getting started');
	expect(getActiveSiteDestination('/component')?.label).toBe('Getting started');
});
