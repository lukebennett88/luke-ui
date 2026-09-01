import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Text } from './text.js';

testConformance({
	path: 'text',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Text element.');
		return target;
	},
	render: (props = {}) => render(<Text {...props}>Body copy</Text>),
});

test('shouldInheritFont wins over the selected typography for the inherited properties', () => {
	// `typography` and `shouldInheritFont` both resolve `fontFamily`/`fontSize`/`letterSpacing`/
	// `lineHeight` (and `shouldInheritFont` also `fontWeight`) — a large `typography` alone proves
	// the two values genuinely differ, so `shouldInheritFont` winning over it is not a false
	// positive from both variants happening to agree.
	const { container } = render(
		<Text typography="display">
			Outer <Text shouldInheritFont>Inherited</Text>
		</Text>,
	);
	const outer = container.firstElementChild as HTMLElement;
	const inherited = outer.querySelector('span:last-child') as HTMLElement;

	expect(getComputedStyle(inherited).fontSize).toBe(getComputedStyle(outer).fontSize);
});
