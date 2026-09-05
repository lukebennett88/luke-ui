import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { Em } from '../em/em.js';
import { Strong } from '../strong/strong.js';
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

// `Em` and `Strong` both compose `Text` with `shouldInheritFont`, so they must take the surrounding
// typography rather than Text's own base. A `display` parent makes the two genuinely differ, so
// this cannot pass by both happening to agree. Each wrapper's own styling must survive that
// inheritance — inheriting everything would silently flatten italic and emphasis weight.
test('Em and Strong inherit the surrounding typography while keeping their own styling', () => {
	const { container } = render(
		<Text typography="display">
			<Em>Emphasis</Em>
			<Strong>Strong</Strong>
		</Text>,
	);
	const outer = container.firstElementChild as HTMLElement;
	const em = outer.querySelector('em') as HTMLElement;
	const strong = outer.querySelector('strong') as HTMLElement;
	const outerComputed = getComputedStyle(outer);

	for (const wrapper of [em, strong]) {
		const computed = getComputedStyle(wrapper);
		expect(computed.fontFamily).toBe(outerComputed.fontFamily);
		expect(computed.fontSize).toBe(outerComputed.fontSize);
		expect(computed.lineHeight).toBe(outerComputed.lineHeight);
		expect(computed.letterSpacing).toBe(outerComputed.letterSpacing);
	}

	expect(getComputedStyle(em).fontStyle).toBe('italic');

	// Strong's own emphasis weight must beat the inherited weight, not be flattened by it.
	const strongWeight = getComputedStyle(strong).fontWeight;
	expect(strongWeight).not.toBe(outerComputed.fontWeight);
	expect(Number(strongWeight)).toBeGreaterThan(Number(outerComputed.fontWeight));
});
