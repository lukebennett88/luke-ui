import { expect, test } from 'vite-plus/test';
import {
	classifyPropGroup,
	groupPropNames,
	NATIVE_PROPS_FORWARDING_KEY,
	PROP_GROUP_ORDER,
	renderNativePropsNote,
} from './component-prop-groups.js';

test('groups visible prop names for ComponentPropsTable rendering', () => {
	const groups = groupPropNames(['appearance', 'onPress', 'isDisabled', 'className']);

	expect(groups.map((group) => group.name)).toEqual([
		'Component props',
		'Events',
		'Styling',
		'Forms',
	]);
	expect(groups[0]?.defaultOpen).toBe(true);
	expect(groups.slice(1).every((group) => group.defaultOpen === false)).toBe(true);
});

test('classifies styling, accessibility, and advanced props into shared groups', () => {
	expect(classifyPropGroup('appearance')).toBe('Component props');
	expect(classifyPropGroup('onPress')).toBe('Events');
	expect(classifyPropGroup('className')).toBe('Styling');
	expect(classifyPropGroup('value')).toBe('Forms');
	expect(classifyPropGroup('aria-label')).toBe('Accessibility');
	expect(classifyPropGroup('children')).toBe('Advanced');
});

test('omits groups that no visible prop falls into', () => {
	const groups = groupPropNames(['appearance', 'onPress']);

	expect(groups.map((group) => group.name)).toEqual(['Component props', 'Events']);
});

test('uses the shared group order constant', () => {
	expect(PROP_GROUP_ORDER).toEqual([
		'Component props',
		'Events',
		'Styling',
		'Forms',
		'Accessibility',
		'Advanced',
	]);
});

test('returns no groups when no visible props are documented', () => {
	expect(groupPropNames([])).toEqual([]);
});

test('omits the native-props marker from every group', () => {
	const groups = groupPropNames(['appearance', NATIVE_PROPS_FORWARDING_KEY]);

	expect(groups.map((group) => group.name)).toEqual(['Component props']);
	expect(groups[0]?.props).toEqual(['appearance']);
});

test('renders the native props note with the exported type name', () => {
	expect(renderNativePropsNote('HeadingProps')).toBe(
		'`HeadingProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
});

test('classifies every ComboboxRootProps form/validation prop as Forms', () => {
	// ComboboxRootProps (packages/@luke-ui/react/src/core/primitives/combobox/root.tsx)
	// redeclares these nine RAC props as its form/validation contract. Naming them literally
	// here means upstream drift, or a future edit to FORM_PROPS, fails this test loudly.
	expect(classifyPropGroup('autoFocus')).toBe('Forms');
	expect(classifyPropGroup('form')).toBe('Forms');
	expect(classifyPropGroup('isDisabled')).toBe('Forms');
	expect(classifyPropGroup('isInvalid')).toBe('Forms');
	expect(classifyPropGroup('isReadOnly')).toBe('Forms');
	expect(classifyPropGroup('isRequired')).toBe('Forms');
	expect(classifyPropGroup('name')).toBe('Forms');
	expect(classifyPropGroup('validate')).toBe('Forms');
	expect(classifyPropGroup('validationBehavior')).toBe('Forms');
});
