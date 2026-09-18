import { afterEach, expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { Button } from '../button/button.js';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { LoadingSkeleton, LoadingSkeletonProvider } from './loading-skeleton.js';

testConformance({
	path: 'loading-skeleton',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a LoadingSkeleton element.');
		return target;
	},
	render: (props = {}) => render(<LoadingSkeleton {...props}>Loading copy</LoadingSkeleton>),
});

test('resolves local, provider, and default loading states', () => {
	const { locator } = render(
		<>
			<LoadingSkeletonProvider isLoading>
				<LoadingSkeleton isLoading={false}>
					<span>Local loading state</span>
				</LoadingSkeleton>
				<LoadingSkeleton>
					<span>Provider loading state</span>
				</LoadingSkeleton>
			</LoadingSkeletonProvider>
			<LoadingSkeleton>
				<span>Default loading state</span>
			</LoadingSkeleton>
		</>,
	);

	const local = locator.getByText('Local loading state').element();
	const provider = locator.getByText('Provider loading state').element();
	const fallback = locator.getByText('Default loading state').element();

	expect(local.closest('[aria-hidden]')).toBeNull();
	expect(provider.closest('[aria-hidden]')).not.toBeNull();
	expect(fallback.closest('[aria-hidden]')).not.toBeNull();
});

async function emulateReducedMotion(reduce: boolean): Promise<void> {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
	});
}

afterEach(async () => {
	await emulateReducedMotion(false);
});

// Regression test: `animation-name: none` alone does not undo the `background-image` the sheen sets
// in its `@supports` block, so a naive reduced-motion override left the gradient frozen at its initial
// position — a static ramp, not the flat placeholder colour reduced motion requires. Covers both
// inline mode (the element is the surface) and block mode (the child and its `::after` overlay are
// the surfaces; the `display: contents` root itself paints nothing).
test('paints a flat surface with no gradient under prefers-reduced-motion: reduce', async () => {
	await emulateReducedMotion(true);

	const { container } = render(
		<>
			<LoadingSkeleton>Loading placeholder text</LoadingSkeleton>
			<LoadingSkeleton>
				<Button>Submit</Button>
			</LoadingSkeleton>
		</>,
	);

	const [inlineRoot, blockRoot] = container.children;
	if (!(inlineRoot instanceof HTMLElement) || !(blockRoot instanceof HTMLElement)) {
		throw new Error('Expected two LoadingSkeleton elements.');
	}
	const child = blockRoot.querySelector(':scope > *');
	if (!(child instanceof HTMLElement)) throw new Error('Expected a block-mode child element.');

	expect(getComputedStyle(inlineRoot).backgroundImage).toBe('none');
	expect(getComputedStyle(child).backgroundImage).toBe('none');
	expect(getComputedStyle(child, '::after').backgroundImage).toBe('none');
});

function pauseSheenAt(progressMs: number): void {
	for (const animation of document.getAnimations()) {
		if (!(animation instanceof CSSAnimation)) continue;
		animation.pause();
		animation.currentTime = progressMs;
	}
}

function sheenPositionX(element: Element): string {
	return getComputedStyle(element).backgroundPositionX;
}

function inlineSkeletonSurface(match: Element): HTMLElement {
	const surface = match.closest('[data-skeleton-inline]');
	if (!(surface instanceof HTMLElement)) {
		throw new Error('Expected an inline LoadingSkeleton surface.');
	}
	return surface;
}

// Regression: matching `[dir="rtl"] *` treated every descendant as RTL even when a nearer `dir="ltr"`
// overrides. `:dir(rtl)` follows the element's effective direction instead.
test('uses the effective writing direction for sheen travel under nested dir overrides', () => {
	const { locator } = render(
		<>
			<div dir="rtl">
				<div dir="ltr">
					<LoadingSkeleton>rtl then ltr</LoadingSkeleton>
				</div>
			</div>
			<div dir="ltr">
				<div dir="rtl">
					<LoadingSkeleton>ltr then rtl</LoadingSkeleton>
				</div>
			</div>
			<div dir="ltr">
				<LoadingSkeleton>ltr baseline</LoadingSkeleton>
			</div>
			<div dir="rtl">
				<LoadingSkeleton>rtl baseline</LoadingSkeleton>
			</div>
		</>,
	);

	const rtlThenLtr = inlineSkeletonSurface(locator.getByText('rtl then ltr').element());
	const ltrThenRtl = inlineSkeletonSurface(locator.getByText('ltr then rtl').element());
	const ltrBaseline = inlineSkeletonSurface(locator.getByText('ltr baseline').element());
	const rtlBaseline = inlineSkeletonSurface(locator.getByText('rtl baseline').element());

	// Past the 0.5s delay, mid-cycle, so LTR/RTL positions differ and stay still for the assert.
	pauseSheenAt(2000);

	expect(sheenPositionX(rtlThenLtr)).toBe(sheenPositionX(ltrBaseline));
	expect(sheenPositionX(ltrThenRtl)).toBe(sheenPositionX(rtlBaseline));
	expect(sheenPositionX(ltrBaseline)).not.toBe(sheenPositionX(rtlBaseline));
});
