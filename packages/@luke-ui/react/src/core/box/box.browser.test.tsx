import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Container } from '@luke-ui/react/container';
import { Grid } from '@luke-ui/react/grid';
import { Stack } from '@luke-ui/react/stack';
import { breakpoints, vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import {
	expectForwardsDomProps,
	expectHtmlElement,
	forwardedDomProps,
} from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedColors, resolvedColor, surfaceColors } from '../test-utils/surface-colors.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('Box forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<Box {...forwardedDomProps} ref={ref}>
			Content
		</Box>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected a Box element.');

	expectForwardsDomProps(target, ref);
});

test('renders semantic elements and a consumer-owned renderRoot prop', () => {
	const semanticResult = render(
		<Box aria-label="Account summary" elementType="section">
			Account summary content
		</Box>,
	);
	const section = semanticResult.locator.getByRole('region', { name: 'Account summary' });
	expect(section.element().tagName).toBe('SECTION');

	let receivedAriaLabel = false;
	const customResult = render(
		<Box
			aria-label="Ignored Box label"
			renderRoot={(domProps) => {
				receivedAriaLabel = Object.hasOwn(domProps, 'aria-label');
				return <div {...domProps} />;
			}}
			style={{ display: 'grid' }}
		>
			Custom div
		</Box>,
	);
	const div = customResult.locator.getByText('Custom div').element();
	if (!(div instanceof HTMLDivElement)) throw new Error('Expected custom rendered div.');

	expect(receivedAriaLabel).toBe(false);
	expect(div.style.display).toBe('grid');
});

test('consumer className and style win collisions on the ordinary element path', () => {
	const ref = createRef<HTMLElement>();
	const baseline = render(
		<Box data-testid="box-baseline" display="flex" gap="space.16" inlineSize="12rem" />,
	);
	const utilityClassName = baseline.locator.getByTestId('box-baseline').element().className;
	baseline.unmount();

	const { locator } = render(
		<Box
			className="consumer-class"
			data-testid="box-element"
			display="flex"
			gap="space.16"
			id="box-root"
			inlineSize="12rem"
			ref={ref}
			style={{ backgroundColor: 'rgb(1, 2, 3)', display: 'grid' }}
		>
			Element path
		</Box>,
	);
	const element = locator.getByTestId('box-element').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Box element.');

	expect(ref.current).toBe(element);
	expect(element.id).toBe('box-root');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe('192px');
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)');
	expectConsumerClassAfterUtilities(element.className, utilityClassName);
});

test('consumer className and style win collisions on the renderRoot callback path', () => {
	const ref = createRef<HTMLElement>();
	const baseline = render(
		<Box
			data-testid="box-baseline"
			display="flex"
			gap={{ initial: 'space.8', bp768: 'space.24' }}
			inlineSize="10rem"
		/>,
	);
	const utilityClassName = baseline.locator.getByTestId('box-baseline').element().className;
	baseline.unmount();

	let receivedRef: unknown;
	const { locator } = render(
		<Box
			className="consumer-class"
			display="flex"
			gap={{ initial: 'space.8', bp768: 'space.24' }}
			inlineSize="10rem"
			ref={ref}
			renderRoot={(domProps) => {
				receivedRef = domProps.ref;
				return <article {...domProps} data-testid="box-render" />;
			}}
			style={{ backgroundColor: 'rgb(4, 5, 6)', display: 'grid' }}
		>
			Render path
		</Box>,
	);
	const element = locator.getByTestId('box-render').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected renderRoot callback element.');

	expect(element.tagName).toBe('ARTICLE');
	expect(ref.current).toBe(element);
	expect(typeof receivedRef).toBe('function');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe('160px');
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(4, 5, 6)');
	expectConsumerClassAfterUtilities(element.className, utilityClassName);
});

for (const [name, Component] of Object.entries({
	AspectRatio,
	Bleed,
	Box,
	Cluster,
	Container,
	Grid,
	Stack,
})) {
	test(`${name} renderRoot receives presentation props and empty state`, () => {
		const calls: Array<Array<unknown>> = [];
		const ref = createRef<HTMLElement>();
		const { locator, unmount } = render(
			<Component
				className="consumer-class"
				maxInlineSize="container.672"
				ref={ref}
				renderRoot={(...args) => {
					const [domProps] = args;
					calls.push(args);
					return <section {...domProps} aria-label="Owned root" />;
				}}
				style={{ backgroundColor: 'rgb(4, 5, 6)' }}
			>
				Content
			</Component>,
		);
		const element = locator.getByRole('region', { name: 'Owned root' }).element();

		expect(calls.length).toBeGreaterThan(0);
		for (const args of calls) {
			expect(args).toEqual([
				{
					children: 'Content',
					className: expect.stringContaining('consumer-class'),
					ref: expect.any(Function),
					style: expect.objectContaining({ backgroundColor: 'rgb(4, 5, 6)' }),
				},
				{},
			]);
		}
		expect(ref.current).toBe(element);
		unmount();
		expect(ref.current).toBeNull();
	});
}

test('renderRoot preserves callback ref cleanup', () => {
	const elements: Array<HTMLElement | null> = [];
	let cleanups = 0;
	const { locator, unmount } = render(
		<Box
			ref={(element) => {
				elements.push(element);
				return () => {
					cleanups += 1;
				};
			}}
			renderRoot={(domProps) => <section {...domProps} aria-label="Owned root" />}
		/>,
	);

	expect(elements).toEqual([locator.getByRole('region', { name: 'Owned root' }).element()]);
	unmount();
	expect(cleanups).toBe(1);
	expect(elements).toHaveLength(1);
});

/** Consumer `className` is merged after utility classes, so it appears later in the token list. */
function expectConsumerClassAfterUtilities(className: string, utilityClassName: string): void {
	const classes = className.split(/\s+/).filter(Boolean);
	const utilityClasses = utilityClassName.split(/\s+/).filter(Boolean);
	const consumerIndex = classes.indexOf('consumer-class');

	expect(consumerIndex).toBeGreaterThan(-1);
	expect(utilityClasses.length).toBeGreaterThan(0);
	for (const utilityClass of utilityClasses) {
		const utilityIndex = classes.indexOf(utilityClass);
		expect(utilityIndex).toBeGreaterThan(-1);
		expect(utilityIndex).toBeLessThan(consumerIndex);
	}
}

const RESTING_BACKGROUNDS = [
	...(['base', 'subdued', 'field', 'overlay'] as const).map(
		(surface) => `surface.${surface}` as const,
	),
	...SEMANTIC_ROLES.flatMap((role) => [`${role}.subtle`, `${role}.solid`] as const),
];

type RestingBackground = (typeof RESTING_BACKGROUNDS)[number];

function byTestId(container: HTMLElement, id: string): HTMLElement {
	const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (element === null) throw new Error(`Expected [data-testid="${id}"].`);
	return element;
}

for (const appearance of visualAppearances) {
	test(`pairs every resting background with its foreground context in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<Box display="flex" flexWrap="wrap" gap="space.8">
				{RESTING_BACKGROUNDS.map((background) => (
					<Box backgroundColor={background} data-testid={background} key={background}>
						{background}
					</Box>
				))}
			</Box>,
			{ appearance },
		);

		for (const background of RESTING_BACKGROUNDS) {
			const element = byTestId(container, background);
			expect(surfaceColors(element)).toEqual(pairedColors(element, background));
		}
		// On-solid text differs from the neutral hierarchy, so the solid checks are not vacuous.
		const solid = byTestId(container, 'accent.solid');
		expect(getComputedStyle(solid).color).not.toBe(resolvedColor(vars.color.text.primary, solid));
	});
}

test('a Box without a background keeps the inherited colour and context', () => {
	const { container } = render(
		<Box backgroundColor="danger.solid" padding="space.8">
			<Box data-testid="transparent" padding="space.8">
				<span data-testid="inline">Inherited</span>
			</Box>
		</Box>,
	);
	const transparent = byTestId(container, 'transparent');
	const inline = byTestId(container, 'inline');

	expect(surfaceColors(transparent)).toEqual({
		...pairedColors(transparent, 'danger.solid'),
		background: 'rgba(0, 0, 0, 0)',
	});
	expect(surfaceColors(inline)).toEqual({
		...pairedColors(inline, 'danger.solid'),
		background: 'rgba(0, 0, 0, 0)',
	});
});

test('a nested background establishes a new context on the same element', () => {
	const { container } = render(
		<Box backgroundColor="accent.solid" data-testid="outer" padding="space.8">
			<Box
				backgroundColor="warning.subtle"
				className="consumer-card"
				data-testid="subtle"
				padding="space.8"
			>
				<Box backgroundColor="success.solid" data-testid="inner" padding="space.8">
					Nested
				</Box>
			</Box>
		</Box>,
	);
	const outer = byTestId(container, 'outer');
	const subtle = byTestId(container, 'subtle');
	const inner = byTestId(container, 'inner');

	expect(subtle.classList).toContain('consumer-card');
	expect(surfaceColors(outer)).toEqual(pairedColors(outer, 'accent.solid'));
	expect(surfaceColors(subtle)).toEqual(pairedColors(subtle, 'warning.subtle'));
	expect(surfaceColors(inner)).toEqual(pairedColors(inner, 'success.solid'));
});

const responsiveCases: ReadonlyArray<{
	backgroundColor: Partial<Record<'initial' | 'bp768' | 'bp1024', RestingBackground>>;
	steps: ReadonlyArray<{ width: number; background: RestingBackground }>;
}> = [
	{
		backgroundColor: { initial: 'surface.base', bp768: 'accent.solid' },
		steps: [
			{ width: breakpoints.bp768 - 1, background: 'surface.base' },
			{ width: breakpoints.bp768, background: 'accent.solid' },
		],
	},
	{
		backgroundColor: { initial: 'danger.solid', bp768: 'info.subtle' },
		steps: [
			{ width: breakpoints.bp768 - 1, background: 'danger.solid' },
			{ width: breakpoints.bp768, background: 'info.subtle' },
		],
	},
	{
		backgroundColor: {
			initial: 'surface.subdued',
			bp768: 'warning.solid',
			bp1024: 'accent.subtle',
		},
		steps: [
			{ width: breakpoints.bp768, background: 'warning.solid' },
			{ width: breakpoints.bp1024, background: 'accent.subtle' },
		],
	},
];

for (const { backgroundColor, steps } of responsiveCases) {
	test(`changes the background and its context together for ${JSON.stringify(backgroundColor)}`, async () => {
		const { container } = render(
			<Box backgroundColor={backgroundColor} data-testid="responsive">
				Responsive
			</Box>,
		);
		const element = byTestId(container, 'responsive');

		try {
			for (const step of steps) {
				// eslint-disable-next-line no-await-in-loop -- viewport changes must be observed in order
				await page.viewport(step.width, 800);
				expect(surfaceColors(element)).toEqual(pairedColors(element, step.background));
			}
		} finally {
			await page.viewport(1024, 800);
		}
	});
}

test('resolves a responsive background against the nearest container', () => {
	const { container } = render(
		<div style={{ containerType: 'inline-size', inlineSize: `${breakpoints.bp768 - 1}px` }}>
			<Box
				backgroundColor={{ initial: 'neutral.subtle', bp768: 'neutral.solid' }}
				data-testid="narrow"
			>
				Narrow container
			</Box>
		</div>,
	);
	const narrow = byTestId(container, 'narrow');

	expect(surfaceColors(narrow)).toEqual(pairedColors(narrow, 'neutral.subtle'));
});

for (const appearance of visualAppearances) {
	const scopeMode = appearance.mode === 'light' ? 'dark' : 'light';

	test(`a ${scopeMode} scope inside a ${appearance.theme} ${appearance.mode} solid re-establishes its own context`, () => {
		const { container } = render(
			<Box backgroundColor="accent.solid" data-testid="solid" padding="space.8">
				<div data-color-mode={scopeMode} data-testid="scope">
					<span data-testid="scoped-text">Scoped</span>
					<Box backgroundColor="danger.solid" data-testid="scoped-solid">
						Scoped solid
					</Box>
				</div>
				<Box backgroundColor="success.solid" data-color-mode={scopeMode} data-testid="own-scope">
					Own scope
				</Box>
			</Box>,
			{ appearance },
		);
		const solid = byTestId(container, 'solid');
		const scope = byTestId(container, 'scope');
		const scopedText = byTestId(container, 'scoped-text');
		const scopedSolid = byTestId(container, 'scoped-solid');
		const ownScope = byTestId(container, 'own-scope');

		// The scope's tokens differ from the outer mode's, so inherited values would fail below.
		expect(resolvedColor(vars.color.text.primary, scope)).not.toBe(
			resolvedColor(vars.color.text.primary, solid),
		);
		expect(surfaceColors(solid)).toEqual(pairedColors(solid, 'accent.solid'));
		expect(surfaceColors(scope)).toEqual(pairedColors(scope, 'surface.base'));
		expect(surfaceColors(scopedText)).toEqual({
			...pairedColors(scopedText, 'surface.base'),
			background: 'rgba(0, 0, 0, 0)',
		});
		expect(surfaceColors(scopedSolid)).toEqual(pairedColors(scopedSolid, 'danger.solid'));
		expect(surfaceColors(ownScope)).toEqual(pairedColors(ownScope, 'success.solid'));
	});
}

test('backgrounds', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<Box display="flex" flexWrap="wrap" gap="space.8" padding="space.16">
				{RESTING_BACKGROUNDS.map((background) => (
					<Box
						backgroundColor={background}
						borderRadius="detail"
						key={background}
						padding="space.8"
					>
						{background}
					</Box>
				))}
			</Box>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'box/backgrounds', appearance);
	}
});

test('layout', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<Box
				display="flex"
				flexDirection="column"
				gap="space.8"
				padding="space.16"
				style={{
					backgroundColor: vars.color.surface.subdued,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.recessed,
					color: vars.color.text.primary,
				}}
			>
				<Box>Account</Box>
				<Box display="flex" gap="space.8">
					<Box>Profile</Box>
					<Box>Security</Box>
				</Box>
			</Box>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'box/layout', appearance);
	}
});
