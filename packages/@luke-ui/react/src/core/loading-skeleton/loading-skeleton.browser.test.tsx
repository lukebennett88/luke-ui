import { expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { LoadingSkeleton } from './loading-skeleton.js';
import { skeletonPulseAnimationName } from './scope.js';

async function emulateMedia(features: Array<{ name: string; value: string }>) {
	await cdp().send('Emulation.setEmulatedMedia', { features });
}

testConformance({
	path: 'loading-skeleton',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a LoadingSkeleton element.');
		return target;
	},
	render: (props = {}) => render(<LoadingSkeleton {...props}>Loading copy</LoadingSkeleton>),
});

test('resets a consumer-supplied border on the inline skeleton surface', () => {
	const { locator } = render(
		<LoadingSkeleton style={{ border: '4px solid red' }}>Loading copy</LoadingSkeleton>,
	);
	const skeleton = locator.getByText('Loading copy').element();
	if (!(skeleton instanceof HTMLElement)) throw new Error('Expected a LoadingSkeleton element.');

	const style = getComputedStyle(skeleton);
	expect(style.borderTopStyle).toBe('none');
	expect(style.borderTopWidth).toBe('0px');
	expect(style.borderTopColor).toBe('rgba(0, 0, 0, 0)');
});

// These tests exercise the retained forced-surface CSS in `styles.css.ts` directly, which is where
// this behaviour actually lives after the loading-skeleton forced-surface consolidation (`!important`
// there, not in `stylex.create`, because a `recipes.priorityN` sublayer must never emit
// `!important` — see `styles.css.ts` and `stylesheet-contract.test.ts`'s guard test). They cover
// inline mode (text children) and block mode (an element child) so a future change cannot silently
// regress one while leaving the other passing.
test('the pulse animation runs with the documented duration and delay in both modes', () => {
	const { locator: inlineLocator } = render(<LoadingSkeleton>Loading copy</LoadingSkeleton>);
	const inline = inlineLocator.getByText('Loading copy').element();
	if (!(inline instanceof HTMLElement)) throw new Error('Expected an inline LoadingSkeleton.');
	const inlineStyle = getComputedStyle(inline);
	expect(inlineStyle.animationName).toBe(skeletonPulseAnimationName);
	expect(inlineStyle.animationDuration).toBe('2s');
	expect(inlineStyle.animationDelay).toBe('0.5s');

	const { container: blockContainer } = render(
		<LoadingSkeleton>
			<button type="button">Submit</button>
		</LoadingSkeleton>,
	);
	const blockChild = blockContainer.querySelector('button');
	if (!(blockChild instanceof HTMLElement)) throw new Error('Expected a wrapped block child.');
	const blockStyle = getComputedStyle(blockChild);
	expect(blockStyle.animationName).toBe(skeletonPulseAnimationName);
	expect(blockStyle.animationDuration).toBe('2s');
	expect(blockStyle.animationDelay).toBe('0.5s');
});

test('masks a wrapped block child so it reads as a flat placeholder', () => {
	const { container } = render(
		<LoadingSkeleton>
			<button type="button" style={{ backgroundColor: 'rgb(1, 2, 3)' }}>
				Submit
			</button>
		</LoadingSkeleton>,
	);
	const blockChild = container.querySelector('button');
	if (!(blockChild instanceof HTMLElement)) throw new Error('Expected a wrapped block child.');

	const style = getComputedStyle(blockChild);
	expect(style.color).toBe('rgba(0, 0, 0, 0)');
	expect(style.pointerEvents).toBe('none');
	expect(style.backgroundColor).not.toBe('rgb(1, 2, 3)');
});

test('stops the pulse under prefers-reduced-motion in both modes', async () => {
	await emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
	try {
		const { locator: inlineLocator } = render(<LoadingSkeleton>Loading copy</LoadingSkeleton>);
		const inline = inlineLocator.getByText('Loading copy').element();
		if (!(inline instanceof HTMLElement)) throw new Error('Expected an inline LoadingSkeleton.');
		expect(getComputedStyle(inline).animationName).toBe('none');

		const { container: blockContainer } = render(
			<LoadingSkeleton>
				<button type="button">Submit</button>
			</LoadingSkeleton>,
		);
		const blockChild = blockContainer.querySelector('button');
		if (!(blockChild instanceof HTMLElement)) throw new Error('Expected a wrapped block child.');
		expect(getComputedStyle(blockChild).animationName).toBe('none');
	} finally {
		await emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
	}
});

test('forces a CanvasText surface and stops the pulse under forced-colors in both modes', async () => {
	await emulateMedia([{ name: 'forced-colors', value: 'active' }]);
	try {
		const { locator: inlineLocator } = render(<LoadingSkeleton>Loading copy</LoadingSkeleton>);
		const inline = inlineLocator.getByText('Loading copy').element();
		if (!(inline instanceof HTMLElement)) throw new Error('Expected an inline LoadingSkeleton.');
		const inlineStyle = getComputedStyle(inline);
		expect(inlineStyle.animationName).toBe('none');
		expect(inlineStyle.forcedColorAdjust).toBe('none');

		const { container: blockContainer } = render(
			<LoadingSkeleton>
				<button type="button">Submit</button>
			</LoadingSkeleton>,
		);
		const blockChild = blockContainer.querySelector('button');
		if (!(blockChild instanceof HTMLElement)) throw new Error('Expected a wrapped block child.');
		const blockStyle = getComputedStyle(blockChild);
		expect(blockStyle.animationName).toBe('none');
		expect(blockStyle.forcedColorAdjust).toBe('none');
	} finally {
		await emulateMedia([{ name: 'forced-colors', value: 'none' }]);
	}
});
