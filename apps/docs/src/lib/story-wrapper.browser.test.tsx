import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Button } from '@luke-ui/react/button';
import { act } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { Comparison, ComparisonItem } from '#docs';
import { StoryWrapper } from './story-wrapper.js';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

afterEach(() => {
	for (const entry of mounted) {
		act(() => entry.root.unmount());
		entry.container.remove();
	}
	mounted.length = 0;
});

test('default and explicit flow give block roots the available width', () => {
	for (const layout of [undefined, 'flow'] as const) {
		const { available, exampleRoot, storyRoot } = renderInWrapper(<div>Block content</div>, {
			layout,
		});
		expect(getComputedStyle(storyRoot).display).toBe('block');
		expect(exampleRoot.getBoundingClientRect().width).toBeCloseTo(available, 0);
	}
});

test('centered keeps an intrinsic Button centred', () => {
	const { available, exampleRoot, storyRoot } = renderInWrapper(<Button>Save changes</Button>, {
		layout: 'centered',
	});
	const storyBox = storyRoot.getBoundingClientRect();
	const buttonBox = exampleRoot.getBoundingClientRect();

	expect(getComputedStyle(storyRoot).display).toBe('flex');
	expect(buttonBox.width).toBeLessThan(available / 2);
	expect(
		Math.abs(buttonBox.left - storyBox.left - (storyBox.right - buttonBox.right)),
	).toBeLessThanOrEqual(1);
});

for (const comparisonCase of [
	{ containerWidth: undefined as number | undefined, expectCompact: true, name: 'wide' },
	{ containerWidth: 280, expectCompact: false, name: 'narrow' },
]) {
	test(`Comparison stays within the ${comparisonCase.name} flow surface and centred`, () => {
		const { available, exampleRoot, storyRoot } = renderInWrapper(comparisonFixture(), {
			containerWidth: comparisonCase.containerWidth,
		});
		const storyBox = storyRoot.getBoundingClientRect();
		const comparisonBox = exampleRoot.getBoundingClientRect();

		expect(comparisonBox.width <= available).toBe(true);
		expect(comparisonBox.width < available || !comparisonCase.expectCompact).toBe(true);
		expect(comparisonBox.left).toBeGreaterThanOrEqual(storyBox.left - 1);
		expect(comparisonBox.right).toBeLessThanOrEqual(storyBox.right + 1);
		expect(
			Math.abs(comparisonBox.left - storyBox.left - (storyBox.right - comparisonBox.right)),
		).toBeLessThanOrEqual(1);
	});
}

test('full-bleed has no inset padding or minimum height', () => {
	const { exampleRoot, storyRoot } = renderInWrapper(
		<div style={{ blockSize: '2rem' }}>Full-bleed content</div>,
		{ layout: 'full-bleed' },
	);

	expect(getComputedStyle(storyRoot).padding).toBe('0px');
	expect(getComputedStyle(storyRoot).display).toBe('block');
	expect(storyRoot.getBoundingClientRect().height).toBeCloseTo(
		exampleRoot.getBoundingClientRect().height,
		0,
	);
});

function comparisonFixture() {
	return (
		<Comparison align="center" direction="horizontal">
			<ComparisonItem label="Before">
				<Button>Save</Button>
			</ComparisonItem>
			<ComparisonItem label="After">
				<Button>Save changes</Button>
			</ComparisonItem>
		</Comparison>
	);
}

function renderInWrapper(
	node: ReactNode,
	{
		containerWidth = 900,
		layout,
	}: {
		containerWidth?: number;
		layout?: ComponentProps<typeof StoryWrapper>['layout'];
	} = {},
) {
	const container = document.createElement('div');
	container.style.cssText = `container-type: inline-size; inline-size: ${containerWidth}px;`;
	document.body.append(container);
	const root = createRoot(container);
	mounted.push({ container, root });
	act(() => {
		root.render(<StoryWrapper layout={layout}>{node}</StoryWrapper>);
	});
	const storyRoot = container.firstElementChild as HTMLElement;
	const exampleRoot = storyRoot.firstElementChild as HTMLElement;
	const style = getComputedStyle(storyRoot);
	const available =
		storyRoot.getBoundingClientRect().width -
		(Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight));
	return { available, exampleRoot, storyRoot };
}
