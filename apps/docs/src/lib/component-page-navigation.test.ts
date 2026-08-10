import { expect, test } from 'vite-plus/test';
import { getComponentPageNavigation } from './component-page-navigation.js';

test('returns Guide and Props links for a component guide', () => {
	expect(getComponentPageNavigation('/components/actions/button')).toEqual({
		current: 'guide',
		guideUrl: '/components/actions/button',
		propsUrl: '/components/actions/button/props',
	});
});

test('marks Props as current on a component props page', () => {
	expect(getComponentPageNavigation('/components/actions/button/props')).toEqual({
		current: 'props',
		guideUrl: '/components/actions/button',
		propsUrl: '/components/actions/button/props',
	});
});

test('does not add component navigation to other docs pages', () => {
	expect(getComponentPageNavigation('/docs/installation')).toBeNull();
	expect(getComponentPageNavigation('/components/actions')).toBeNull();
	expect(getComponentPageNavigation('/components/actions/button/examples')).toBeNull();
});
