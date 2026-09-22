import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { act } from 'react';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { Comparison, ComparisonItem } from '../examples/comparison.js';
import { StoryWrapper } from './story-wrapper.js';

// A test may mount more than once (e.g. the same fixture at two container
// widths), so every mount is tracked and torn down rather than just the last.
const mounted: Array<{ container: HTMLElement; root: Root }> = [];

afterEach(() => {
	for (const entry of mounted) {
		act(() => entry.root.unmount());
		entry.container.remove();
	}
	mounted.length = 0;
});

// This suite tests `StoryWrapper`'s harness contract, not a classification of
// all examples: its default `inset` mode is a flex container with
// `align-items: center; justify-content: center`, which shrink-wraps
// children to their content width unless a child explicitly requests width
// (e.g. `inlineSize="100%"`). Each test below pins one known input to one
// explicit expected layout outcome.

test('an intrinsic control stays intrinsic and is centred', () => {
	const { available, exampleRoot, storyRoot, width } = renderInWrapper(
		<Button>Save changes</Button>,
	);

	// A single intrinsic-width control must not stretch to fill the wrapper.
	expect(width).toBeLessThan(available / 2);

	// `justify-content: center` must centre it: the gap on each side of the
	// example root within `storyRoot` should match.
	const storyBox = storyRoot.getBoundingClientRect();
	const exampleBox = exampleRoot.getBoundingClientRect();
	const leftGap = exampleBox.left - storyBox.left;
	const rightGap = storyBox.right - exampleBox.right;
	expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
});

test('an intrinsic composition stays intrinsic', () => {
	const { available, width } = renderInWrapper(
		<Comparison align="center" direction="horizontal">
			<ComparisonItem label="Before">
				<Button>Save</Button>
			</ComparisonItem>
			<ComparisonItem label="After">
				<Button>Save changes</Button>
			</ComparisonItem>
		</Comparison>,
	);

	// A composition of intrinsic-width controls must also shrink-wrap, not
	// stretch to fill the wrapper, even though it has multiple children.
	expect(width).toBeLessThan(available);
});

test('a fill layout consumes the available width and produces multiple columns', () => {
	// THIS IS THE FOUNDING REGRESSION. Removing `inlineSize="100%"` from this
	// fixture must make this test fail: without it, `AutoGrid` shrink-wraps to
	// its content width inside the centring flex container instead of filling
	// the available space, so it never gets wide enough to produce more than
	// one grid track.
	const { available, exampleRoot, width } = renderInWrapper(
		<AutoGrid gap="sp12" inlineSize="100%" minColumnInlineSize="12rem">
			<span>Span 1</span>
			<span>Span 2</span>
			<span>Span 3</span>
			<span>Span 4</span>
			<span>Span 5</span>
			<span>Span 6</span>
		</AutoGrid>,
	);

	expect(width).toBeCloseTo(available, 0);

	const columns = getComputedStyle(exampleRoot).gridTemplateColumns.split(' ').filter(Boolean);
	expect(columns.length).toBeGreaterThan(1);
});

test('a fill layout nested inside a block element still consumes the width', () => {
	// Models the known `<form>` bugs: a block-level `<form>` explicitly
	// requesting full width, wrapping a `Stack` that also requests full width,
	// must still consume the wrapper's available width rather than
	// shrink-wrapping to its widest child.
	const { available, storyRoot } = renderInWrapper(
		<form style={{ inlineSize: '100%' }}>
			<Stack gap="sp16" inlineSize="100%">
				<Button>Save</Button>
				<Button>Cancel</Button>
			</Stack>
		</form>,
	);

	const form = storyRoot.querySelector('form');
	if (!form) throw new Error('expected a form element');
	expect(form.getBoundingClientRect().width).toBeCloseTo(available, 0);
});

test('a max-inline-size cap is respected inside a fill layout', () => {
	// 20rem = 320px. The cap must bind regardless of how much space the
	// wrapper offers, so this is checked at two container widths.
	const capPx = 320;

	const wide = renderInWrapper(
		<Stack gap="sp16" inlineSize="100%" maxInlineSize="20rem">
			<Button>Save</Button>
			<Button>Cancel</Button>
		</Stack>,
		900,
	);
	expect(wide.width).toBeCloseTo(Math.min(wide.available, capPx), 0);
	expect(wide.width).toBeCloseTo(capPx, 0);

	const narrow = renderInWrapper(
		<Stack gap="sp16" inlineSize="100%" maxInlineSize="20rem">
			<Button>Save</Button>
			<Button>Cancel</Button>
		</Stack>,
		400,
	);
	// At a wide container the cap binds, not the container: it stays 320px
	// rather than growing to fill more of the wrapper.
	expect(narrow.width).toBeCloseTo(capPx, 0);
});

test('an explicitly narrow wrapper stays narrow', () => {
	// Models `auto-grid/minimum-column-size`: a block wrapper narrower than
	// the grid's minimum column size must stay at its own explicit width, and
	// the grid inside it must collapse to a single track.
	const { exampleRoot } = renderInWrapper(
		<div style={{ inlineSize: '10rem' }}>
			<AutoGrid gap="sp12" minColumnInlineSize="16rem">
				<span>Span 1</span>
				<span>Span 2</span>
			</AutoGrid>
		</div>,
	);

	expect(exampleRoot.getBoundingClientRect().width).toBeCloseTo(160, 0);

	const autoGrid = Array.from(exampleRoot.querySelectorAll('*')).find(
		(element) => getComputedStyle(element).display === 'grid',
	);
	if (!autoGrid) throw new Error('expected an AutoGrid element');
	const columns = getComputedStyle(autoGrid).gridTemplateColumns.split(' ').filter(Boolean);
	expect(columns.length).toBe(1);
});

// Mounts `children` inside a fixed-width inline-size container wrapping the
// real `StoryWrapper`, mirroring how `ExamplePreview` sizes an example.
function renderInWrapper(node: ReactNode, containerWidth = 900) {
	const container = document.createElement('div');
	container.className = tactileThemeClassName;
	container.style.cssText = `container-type: inline-size; inline-size: ${containerWidth}px;`;
	document.body.append(container);
	const root = createRoot(container);
	mounted.push({ container, root });
	act(() => {
		root.render(<StoryWrapper>{node}</StoryWrapper>);
	});
	const storyRoot = container.firstElementChild as HTMLElement;
	const exampleRoot = storyRoot.firstElementChild as HTMLElement;
	const style = getComputedStyle(storyRoot);
	const available =
		storyRoot.getBoundingClientRect().width -
		(Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight));
	return {
		available,
		exampleRoot,
		storyRoot,
		width: exampleRoot.getBoundingClientRect().width,
	};
}
