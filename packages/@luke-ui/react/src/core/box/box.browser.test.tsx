import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Container } from '@luke-ui/react/container';
import { Grid } from '@luke-ui/react/grid';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { breakpoints, vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import { expectNoAxeViolations } from '../test-utils/axe.js';
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
	...(['base', 'subdued', 'raised'] as const).map((surface) => `surface.${surface}` as const),
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
		expect(getComputedStyle(solid).color).not.toBe(
			resolvedColor(vars.color.foreground.primary, solid),
		);
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
		expect(resolvedColor(vars.color.foreground.primary, scope)).not.toBe(
			resolvedColor(vars.color.foreground.primary, solid),
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
					backgroundColor: vars.color.background.surface.subdued,
					borderRadius: vars.radius.surface,
					boxShadow: vars.shadow.inset,
					color: vars.color.foreground.primary,
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

for (const appearance of visualAppearances) {
	// A container query changes the fill's category, so the descendant Text must change with it.
	test(`a container-query background hands its context to descendant Text in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<>
				{[breakpoints.bp768 - 1, breakpoints.bp768].map((inlineSize) => (
					<div
						key={inlineSize}
						style={{ containerType: 'inline-size', inlineSize: `${inlineSize}px` }}
					>
						<Box
							backgroundColor={{ initial: 'danger.subtle', bp768: 'accent.solid' }}
							data-testid={`fill-${inlineSize}`}
						>
							<Text color="danger" data-testid={`text-${inlineSize}`}>
								Danger
							</Text>
						</Box>
					</div>
				))}
			</>,
			{ appearance },
		);
		const narrow = byTestId(container, `fill-${breakpoints.bp768 - 1}`);
		const wide = byTestId(container, `fill-${breakpoints.bp768}`);

		expect({
			narrow: surfaceColors(narrow),
			narrowText: getComputedStyle(byTestId(container, `text-${breakpoints.bp768 - 1}`)).color,
			wide: surfaceColors(wide),
			wideText: getComputedStyle(byTestId(container, `text-${breakpoints.bp768}`)).color,
		}).toEqual({
			narrow: pairedColors(narrow, 'danger.subtle'),
			narrowText: pairedColors(narrow, 'danger.subtle').foreground.danger,
			wide: pairedColors(wide, 'accent.solid'),
			wideText: pairedColors(wide, 'accent.solid').foreground.danger,
		});
	});
}

type Corner = { horizontal: number; vertical: number };
type Corners = Record<'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight', Corner>;

/** An element's four computed corner radii in pixels, rounded to hundredths. */
function cornerRadii(element: HTMLElement): Corners {
	const style = getComputedStyle(element);
	const corner = (value: string): Corner => {
		const [horizontal = 0, vertical = horizontal] = value
			.split(' ')
			.map((part) => Math.round(Number.parseFloat(part) * 100) / 100);
		return { horizontal, vertical };
	};
	return {
		bottomLeft: corner(style.borderBottomLeftRadius),
		bottomRight: corner(style.borderBottomRightRadius),
		topLeft: corner(style.borderTopLeftRadius),
		topRight: corner(style.borderTopRightRadius),
	};
}

/**
 * The corners a child needs to be concentric with `surface`: each of the surface's corners, less
 * the gap between the two border boxes on that corner's sides. The gap is measured from layout, not
 * read from the custom properties the feature uses.
 */
function concentricCorners(child: HTMLElement, surface: HTMLElement): Corners {
	const outer = cornerRadii(surface);
	const a = surface.getBoundingClientRect();
	const b = child.getBoundingClientRect();
	const gap = {
		bottom: a.bottom - b.bottom,
		left: b.left - a.left,
		right: a.right - b.right,
		top: b.top - a.top,
	};
	const inner = (corner: Corner, horizontal: number, vertical: number): Corner => ({
		horizontal: Math.max(0, Math.round((corner.horizontal - horizontal) * 100) / 100),
		vertical: Math.max(0, Math.round((corner.vertical - vertical) * 100) / 100),
	});
	return {
		bottomLeft: inner(outer.bottomLeft, gap.left, gap.bottom),
		bottomRight: inner(outer.bottomRight, gap.right, gap.bottom),
		topLeft: inner(outer.topLeft, gap.left, gap.top),
		topRight: inner(outer.topRight, gap.right, gap.top),
	};
}

function uniformCorners(radius: number): Corners {
	const corner = { horizontal: radius, vertical: radius };
	return { bottomLeft: corner, bottomRight: corner, topLeft: corner, topRight: corner };
}

for (const appearance of visualAppearances) {
	test(`concentric corners follow each surface through nested levels in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<Box borderRadius="overlay" data-testid="surface" padding="space.4">
				<Box borderRadius="concentric" data-testid="level-1" padding="space.4">
					<Box borderRadius="concentric" data-testid="level-2" padding="space.4">
						<Box borderRadius="concentric" data-testid="level-3">
							Content
						</Box>
					</Box>
				</Box>
			</Box>,
			{ appearance },
		);
		const surface = byTestId(container, 'surface');
		const levels = ['level-1', 'level-2', 'level-3'].map((id) => byTestId(container, id));

		expect(cornerRadii(levels[0]!)).toEqual(concentricCorners(levels[0]!, surface));
		expect(cornerRadii(levels[1]!)).toEqual(concentricCorners(levels[1]!, levels[0]!));
		expect(cornerRadii(levels[2]!)).toEqual(concentricCorners(levels[2]!, levels[1]!));
		// The theme's overlay radius is larger than one inset, so the first level is rounded.
		expect(cornerRadii(levels[0]!).topLeft.horizontal).toBeGreaterThan(0);
	});
}

test('concentric corners have no nesting limit', () => {
	const levels = 8;
	let node = <Box borderRadius="concentric" data-testid={`level-${levels}`} />;
	for (let level = levels - 1; level >= 1; level--) {
		node = (
			<Box borderRadius="concentric" data-testid={`level-${level}`} padding="space.4">
				{node}
			</Box>
		);
	}
	const { container } = render(
		<Box borderRadius="full" data-testid="level-0" padding="space.4">
			{node}
		</Box>,
	);

	for (let level = 1; level <= levels; level++) {
		const child = byTestId(container, `level-${level}`);
		const parent = byTestId(container, `level-${level - 1}`);
		expect(cornerRadii(child), `level ${level}`).toEqual(concentricCorners(child, parent));
	}
});

for (const direction of ['ltr', 'rtl'] as const) {
	test(`concentric corners take each axis from its own logical side in ${direction}`, () => {
		const { container } = render(
			<div dir={direction}>
				<Box
					borderRadius="overlay"
					data-testid="surface"
					paddingBlockEnd="space.8"
					paddingBlockStart="space.4"
					paddingInlineEnd="space.12"
					paddingInlineStart="space.8"
				>
					<Box borderRadius="concentric" data-testid="child">
						Content
					</Box>
				</Box>
			</div>,
		);
		const child = byTestId(container, 'child');
		const corners = cornerRadii(child);

		expect(corners).toEqual(concentricCorners(child, byTestId(container, 'surface')));
		// Unequal insets give elliptical corners.
		expect(corners.topLeft.horizontal).not.toBe(corners.topLeft.vertical);
	});
}

test('a drawn border counts toward the inset', () => {
	const { container } = render(
		<Box
			borderColor="decorative"
			borderRadius="overlay"
			borderStyle="solid"
			borderWidth="thick"
			data-testid="surface"
			padding="space.4"
		>
			<Box borderRadius="concentric" data-testid="child">
				Content
			</Box>
		</Box>,
	);
	const child = byTestId(container, 'child');

	expect(cornerRadii(child)).toEqual(concentricCorners(child, byTestId(container, 'surface')));
});

test('a border width with no border style adds no inset', () => {
	const { container } = render(
		<Box borderRadius="overlay" borderWidth="thick" data-testid="surface" padding="space.4">
			<Box borderRadius="concentric" data-testid="child">
				Content
			</Box>
		</Box>,
	);
	const surface = byTestId(container, 'surface');
	const child = byTestId(container, 'child');

	expect(getComputedStyle(surface).borderTopStyle).toBe('none');
	expect(cornerRadii(child)).toEqual(concentricCorners(child, surface));
});

test('a padded Box with no radius passes the surface corners on, less its padding', () => {
	const { container } = render(
		<Box borderRadius="overlay" data-testid="surface" padding="space.4">
			<Box paddingBlock="space.4">
				<Box display="flex" flexDirection="column" paddingInlineStart="space.8">
					<Box borderRadius="concentric" data-testid="child">
						Content
					</Box>
				</Box>
			</Box>
		</Box>,
	);
	const child = byTestId(container, 'child');

	expect(cornerRadii(child)).toEqual(concentricCorners(child, byTestId(container, 'surface')));
});

test('a Box with a drawn border and no radius is a square surface', () => {
	const { container } = render(
		<Box borderRadius="overlay" padding="space.4">
			<Box
				borderColor="decorative"
				borderStyle="solid"
				borderWidth="thin"
				data-testid="square"
				padding="space.4"
			>
				<Box borderRadius="concentric" data-testid="child">
					Content
				</Box>
			</Box>
		</Box>,
	);

	expect(cornerRadii(byTestId(container, 'child'))).toEqual(uniformCorners(0));
});

test('a plain element between keeps the corners of the surface around it', () => {
	const { container } = render(
		<Box borderRadius="overlay" data-testid="surface" padding="space.8">
			<section>
				<Box borderRadius="concentric" data-testid="child">
					Content
				</Box>
			</section>
		</Box>,
	);
	const child = byTestId(container, 'child');

	expect(cornerRadii(child)).toEqual(concentricCorners(child, byTestId(container, 'surface')));
});

test('an explicit radius on a nested Box starts a new surface', () => {
	const { container } = render(
		<Box borderRadius="overlay" padding="space.4">
			<Box borderRadius="detail" data-testid="surface" padding="space.4">
				<Box borderRadius="concentric" data-testid="child">
					Content
				</Box>
			</Box>
		</Box>,
	);
	const child = byTestId(container, 'child');

	expect(cornerRadii(child)).toEqual(concentricCorners(child, byTestId(container, 'surface')));
});

test('a concentric Box with no surface around it has square corners', () => {
	const { container } = render(
		<Box borderRadius="concentric" data-testid="child" padding="space.8">
			Content
		</Box>,
	);

	expect(cornerRadii(byTestId(container, 'child'))).toEqual(uniformCorners(0));
});

test('concentric corners follow responsive padding precedence', () => {
	// `paddingInline` replaces the shorthand only from bp768, so below it every side keeps `space.12`.
	const { container } = render(
		<>
			{[breakpoints.bp768 - 1, breakpoints.bp768].map((inlineSize) => (
				<div
					key={inlineSize}
					style={{ containerType: 'inline-size', inlineSize: `${inlineSize}px` }}
				>
					<Box
						borderRadius="overlay"
						data-testid={`surface-${inlineSize}`}
						padding="space.12"
						paddingInline={{ bp768: 'space.4' }}
					>
						<Box borderRadius="concentric" data-testid={`child-${inlineSize}`}>
							Content
						</Box>
					</Box>
				</div>
			))}
		</>,
	);

	for (const inlineSize of [breakpoints.bp768 - 1, breakpoints.bp768]) {
		const surface = byTestId(container, `surface-${inlineSize}`);
		const child = byTestId(container, `child-${inlineSize}`);
		expect(cornerRadii(child), `${inlineSize}px`).toEqual(concentricCorners(child, surface));
	}
	const narrow = getComputedStyle(byTestId(container, `surface-${breakpoints.bp768 - 1}`));
	const wide = getComputedStyle(byTestId(container, `surface-${breakpoints.bp768}`));
	expect(narrow.paddingLeft).toBe(narrow.paddingTop);
	expect(wide.paddingLeft).not.toBe(wide.paddingTop);
});

test('a radius or border that starts at a breakpoint makes a surface from that breakpoint', () => {
	const widths = [breakpoints.bp768 - 1, breakpoints.bp768] as const;
	const { container } = render(
		<>
			{widths.map((inlineSize) => (
				<div
					key={inlineSize}
					style={{ containerType: 'inline-size', inlineSize: `${inlineSize}px` }}
				>
					<Box borderRadius="overlay" data-testid={`radius-outer-${inlineSize}`} padding="space.4">
						<Box
							borderRadius={{ bp768: 'detail' }}
							data-testid={`radius-${inlineSize}`}
							padding="space.4"
						>
							<Box borderRadius="concentric" data-testid={`radius-child-${inlineSize}`}>
								Content
							</Box>
						</Box>
					</Box>
					<Box borderRadius="overlay" data-testid={`border-outer-${inlineSize}`} padding="space.4">
						<Box
							borderColor="decorative"
							borderStyle={{ bp768: 'solid', initial: 'none' }}
							borderWidth="thin"
							padding="space.4"
						>
							<Box borderRadius="concentric" data-testid={`border-child-${inlineSize}`}>
								Content
							</Box>
						</Box>
					</Box>
				</div>
			))}
		</>,
	);
	const [below, above] = widths;

	// Below the breakpoint both Boxes are spacing, so their children follow the outer surface.
	for (const kind of ['radius', 'border']) {
		const child = byTestId(container, `${kind}-child-${below}`);
		const outer = byTestId(container, `${kind}-outer-${below}`);
		expect({ [kind]: cornerRadii(child) }).toEqual({ [kind]: concentricCorners(child, outer) });
	}
	// From the breakpoint the radius makes a surface, and the border makes a square one.
	const radiusChild = byTestId(container, `radius-child-${above}`);
	expect(cornerRadii(radiusChild)).toEqual(
		concentricCorners(radiusChild, byTestId(container, `radius-${above}`)),
	);
	expect(cornerRadii(byTestId(container, `border-child-${above}`))).toEqual(uniformCorners(0));
});

test('consumer className and style override concentric corners', () => {
	const style = document.head.appendChild(document.createElement('style'));
	style.textContent = '.consumer-radius { border-radius: 2px; }';
	try {
		const { container } = render(
			<Box borderRadius="overlay" padding="space.4">
				<Box borderRadius="concentric" className="consumer-radius" data-testid="class">
					Class
				</Box>
				<Box borderRadius="concentric" data-testid="style" style={{ borderRadius: 3 }}>
					Style
				</Box>
			</Box>,
		);

		expect(cornerRadii(byTestId(container, 'class'))).toEqual(uniformCorners(2));
		expect(cornerRadii(byTestId(container, 'style'))).toEqual(uniformCorners(3));
	} finally {
		style.remove();
	}
});

test('a nested concentric card has no axe violations', async () => {
	const { container } = render(
		<Box backgroundColor="surface.raised" borderRadius="overlay" padding="space.8">
			<Box backgroundColor="surface.subdued" borderRadius="concentric" padding="space.12">
				<Text>Card content</Text>
			</Box>
		</Box>,
	);

	await expectNoAxeViolations(container);
});

test('concentric corners', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<Box display="flex" flexWrap="wrap" gap="space.16" padding="space.16">
				<Box backgroundColor="surface.subdued" borderRadius="overlay" padding="space.8">
					<Box
						backgroundColor="surface.raised"
						borderRadius="concentric"
						boxShadow="resting"
						padding="space.4"
					>
						<Box backgroundColor="accent.subtle" borderRadius="concentric" padding="space.8">
							Uniform
						</Box>
					</Box>
				</Box>
				<Box
					backgroundColor="surface.subdued"
					borderRadius="overlay"
					paddingBlock="space.4"
					paddingInline="space.12"
				>
					<Box backgroundColor="accent.subtle" borderRadius="concentric" padding="space.8">
						Elliptical
					</Box>
				</Box>
				<Box
					backgroundColor="surface.subdued"
					borderColor="decorative"
					borderRadius="overlay"
					borderStyle="solid"
					borderWidth="thick"
					padding="space.4"
				>
					<Box paddingInline="space.4">
						<Box backgroundColor="accent.subtle" borderRadius="concentric" padding="space.8">
							Border and spacing
						</Box>
					</Box>
				</Box>
			</Box>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'box/concentric', appearance);
	}
});
