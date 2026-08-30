import { expect, test } from 'vite-plus/test';
import { findComponentPropsTableTags } from './component-props-table-tags.js';

test('reads a single-line component-props-table tag under the API heading', () => {
	const guide = `## Related components

See Link.

## API

<component-props-table path="packages/@luke-ui/react/src/core/button/button.tsx" name="ButtonProps" />
`;

	expect(findComponentPropsTableTags(guide)).toEqual([
		{ name: 'ButtonProps', path: 'packages/@luke-ui/react/src/core/button/button.tsx' },
	]);
});

test('reads multi-line tags in file order under a multi-type API section', () => {
	const guide = `## API

### HeadingProps

<component-props-table
	path="packages/@luke-ui/react/src/core/heading/heading.tsx"
	name="HeadingProps"
/>

### HeadingLevelsProps

<component-props-table
	path="packages/@luke-ui/react/src/core/heading/heading-context.tsx"
	name="HeadingLevelsProps"
/>
`;

	expect(findComponentPropsTableTags(guide)).toEqual([
		{ name: 'HeadingProps', path: 'packages/@luke-ui/react/src/core/heading/heading.tsx' },
		{
			name: 'HeadingLevelsProps',
			path: 'packages/@luke-ui/react/src/core/heading/heading-context.tsx',
		},
	]);
});

test('ignores a component-props-table tag outside the API section', () => {
	const guide = `<component-props-table path="packages/@luke-ui/react/src/core/button/button.tsx" name="ButtonProps" />

## Related components

See Link.
`;

	expect(findComponentPropsTableTags(guide)).toEqual([]);
});

test('returns no entries when the guide has no API section', () => {
	const guide = `## Related components

See Link.
`;

	expect(findComponentPropsTableTags(guide)).toEqual([]);
});
