import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
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

test('flow gives AutoGrid multiple tracks without explicit width', () => {
	const { available, exampleRoot } = renderInWrapper(
		<AutoGrid gap="sp12" minColumnInlineSize="12rem">
			<span>First</span>
			<span>Second</span>
			<span>Third</span>
			<span>Fourth</span>
		</AutoGrid>,
	);

	expect(exampleRoot.getBoundingClientRect().width).toBeCloseTo(available, 0);
	expect(getComputedStyle(exampleRoot).gridTemplateColumns.split(' ').filter(Boolean).length).toBe(
		4,
	);
});

test('flow gives an unsized form and nested Stack the available width', () => {
	const { available, exampleRoot } = renderInWrapper(
		<form>
			<Stack gap="sp16">
				<label htmlFor="form-name">Name</label>
				<input id="form-name" />
			</Stack>
		</form>,
	);

	expect(exampleRoot.getBoundingClientRect().width).toBeCloseTo(available, 0);
	expect(exampleRoot.firstElementChild?.getBoundingClientRect().width).toBeCloseTo(available, 0);
	expect(getComputedStyle(exampleRoot.querySelector('label') as HTMLElement).textAlign).toBe(
		'start',
	);
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

test('centered intentionally keeps an unsized AutoGrid intrinsic', () => {
	const { available, exampleRoot } = renderInWrapper(
		<AutoGrid gap="sp12" minColumnInlineSize="12rem">
			<span>First</span>
			<span>Second</span>
		</AutoGrid>,
		{ layout: 'centered' },
	);

	expect(exampleRoot.getBoundingClientRect().width).toBeLessThan(available);
	expect(getComputedStyle(exampleRoot).gridTemplateColumns.split(' ').filter(Boolean).length).toBe(
		1,
	);
});

test('flow respects a max-inline-size cap without requiring full width', () => {
	const wide = renderInWrapper(
		<Stack gap="sp16" maxInlineSize="20rem">
			<Button>Save</Button>
		</Stack>,
	);
	const narrow = renderInWrapper(
		<Stack gap="sp16" maxInlineSize="20rem">
			<Button>Save</Button>
		</Stack>,
		{ containerWidth: 300 },
	);

	expect(wide.exampleRoot.getBoundingClientRect().width).toBeCloseTo(320, 0);
	expect(narrow.exampleRoot.getBoundingClientRect().width).toBeCloseTo(narrow.available, 0);
});

test('flow retains deliberately narrow example sizing', () => {
	const { exampleRoot } = renderInWrapper(
		<div style={{ inlineSize: '10rem' }}>
			<AutoGrid gap="sp12" minColumnInlineSize="16rem">
				<span>First</span>
				<span>Second</span>
			</AutoGrid>
		</div>,
	);
	const autoGrid = exampleRoot.firstElementChild as HTMLElement;

	expect(exampleRoot.getBoundingClientRect().width).toBeCloseTo(160, 0);
	expect(getComputedStyle(autoGrid).gridTemplateColumns.split(' ').filter(Boolean).length).toBe(1);
});

test.each([
	{ containerWidth: undefined as number | undefined, expectCompact: true, name: 'wide' },
	{ containerWidth: 280, expectCompact: false, name: 'narrow' },
])(
	'Comparison stays within the $name flow surface and centred',
	({ containerWidth, expectCompact }) => {
		const { available, exampleRoot, storyRoot } = renderInWrapper(comparisonFixture(), {
			containerWidth,
		});
		const storyBox = storyRoot.getBoundingClientRect();
		const comparisonBox = exampleRoot.getBoundingClientRect();

		if (expectCompact) expect(comparisonBox.width).toBeLessThan(available);
		else expect(comparisonBox.width).toBeLessThanOrEqual(available);
		expect(comparisonBox.left).toBeGreaterThanOrEqual(storyBox.left - 1);
		expect(comparisonBox.right).toBeLessThanOrEqual(storyBox.right + 1);
		expect(
			Math.abs(comparisonBox.left - storyBox.left - (storyBox.right - comparisonBox.right)),
		).toBeLessThanOrEqual(1);
	},
);

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
	container.className = tactileThemeClassName;
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
