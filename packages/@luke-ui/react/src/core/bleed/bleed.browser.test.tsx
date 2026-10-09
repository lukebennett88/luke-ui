import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('bleeds on the inline axis', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '200px', paddingInline: vars.space.sp32 }}>
			<Bleed data-testid="bleed" inline="sp32">
				Content
			</Bleed>
		</div>,
	);
	const parent = expectHtmlElement(locator.getByTestId('parent').element());
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const parentBox = parent.getBoundingClientRect();
	const bleedBox = bleed.getBoundingClientRect();

	expect(bleedBox.left).toBeCloseTo(parentBox.left, 1);
	expect(bleedBox.right).toBeCloseTo(parentBox.right, 1);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('-32px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('-32px');
});

test('bleeds on all four edges', () => {
	const { locator } = render(
		<Bleed all="sp16" data-testid="bleed">
			Content
		</Bleed>,
	);
	const style = getComputedStyle(expectHtmlElement(locator.getByTestId('bleed').element()));

	expect(style.marginInlineStart).toBe('-16px');
	expect(style.marginInlineEnd).toBe('-16px');
	expect(style.marginBlockStart).toBe('-16px');
	expect(style.marginBlockEnd).toBe('-16px');
});

test('bleeds on the block axis', () => {
	const { locator } = render(
		<div data-testid="parent" style={{ paddingBlock: vars.space.sp16 }}>
			<Bleed block="sp16" data-testid="bleed">
				Content
			</Bleed>
		</div>,
	);
	const parent = expectHtmlElement(locator.getByTestId('parent').element());
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const parentBox = parent.getBoundingClientRect();
	const bleedBox = bleed.getBoundingClientRect();

	// Negative block margins shift the border box into the padding; they do not grow its height.
	expect(bleedBox.top).toBeCloseTo(parentBox.top, 1);
	expect(getComputedStyle(bleed).marginBlockStart).toBe('-16px');
	expect(getComputedStyle(bleed).marginBlockEnd).toBe('-16px');
});

test('bleeds on each logical edge', () => {
	const { locator } = render(
		<div
			data-testid="parent"
			style={{
				paddingBlock: vars.space.sp24,
				paddingInline: vars.space.sp32,
			}}
		>
			<Bleed
				blockEnd="sp8"
				blockStart="sp16"
				data-testid="bleed"
				inlineEnd="sp24"
				inlineStart="sp32"
			>
				Content
			</Bleed>
		</div>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const style = getComputedStyle(bleed);

	expect(style.marginInlineStart).toBe('-32px');
	expect(style.marginInlineEnd).toBe('-24px');
	expect(style.marginBlockStart).toBe('-16px');
	expect(style.marginBlockEnd).toBe('-8px');
});

test('edge props override axis shorthands at the same responsive condition', () => {
	const { locator } = render(
		<Bleed block="sp24" blockStart="sp8" data-testid="bleed" inline="sp32" inlineStart="sp16">
			Content
		</Bleed>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const style = getComputedStyle(bleed);

	expect(style.marginInlineStart).toBe('-16px');
	expect(style.marginInlineEnd).toBe('-32px');
	expect(style.marginBlockStart).toBe('-8px');
	expect(style.marginBlockEnd).toBe('-24px');
});

test('axis and edge props override all at the same responsive condition', () => {
	const { locator } = render(
		<Bleed all="sp32" block="sp24" blockEnd="sp8" data-testid="bleed" inline="sp16" inlineStart="0">
			Content
		</Bleed>,
	);
	const style = getComputedStyle(expectHtmlElement(locator.getByTestId('bleed').element()));

	expect(style.marginInlineStart).toBe('0px');
	expect(style.marginInlineEnd).toBe('-16px');
	expect(style.marginBlockStart).toBe('-24px');
	expect(style.marginBlockEnd).toBe('-8px');
});

test('resolves responsive bleed values', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ containerType: 'inline-size', inlineSize: '100%' }}>
			<Bleed data-testid="bleed" inline={{ initial: 'sp8', bp768: 'sp32' }}>
				Content
			</Bleed>
		</div>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

	expect(getComputedStyle(bleed).marginInlineStart).toBe('-8px');

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('-32px');
});

test('later all values override direct axis and edge values and can reset them', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ containerType: 'inline-size', inlineSize: '100%' }}>
			<Bleed
				all={{ initial: 'sp8', bp768: 'sp32', bp1024: '0' }}
				blockEnd="sp24"
				data-testid="bleed"
				inline="sp16"
			>
				Content
			</Bleed>
		</div>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

	expect(getComputedStyle(bleed).marginInlineStart).toBe('-16px');
	expect(getComputedStyle(bleed).marginBlockEnd).toBe('-24px');
	expect(getComputedStyle(bleed).marginBlockStart).toBe('-8px');

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('-32px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('-32px');
	expect(getComputedStyle(bleed).marginBlockStart).toBe('-32px');
	expect(getComputedStyle(bleed).marginBlockEnd).toBe('-32px');

	await page.viewport(breakpoints.bp1024, 800);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('0px');
	expect(getComputedStyle(bleed).marginBlockEnd).toBe('0px');
});

test('edge props override axis values per responsive condition', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ containerType: 'inline-size', inlineSize: '100%' }}>
			<Bleed
				data-testid="bleed"
				inline={{ initial: 'sp16', bp768: 'sp32' }}
				inlineStart={{ bp768: 'sp8' }}
			>
				Content
			</Bleed>
		</div>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

	expect(getComputedStyle(bleed).marginInlineStart).toBe('-16px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('-16px');

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('-8px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('-32px');
});

for (const emptyValue of [undefined, null]) {
	test(`falls back to the axis value where a responsive edge value is ${emptyValue}`, async () => {
		await page.viewport(breakpoints.bp640, 800);
		const { locator } = render(
			<div style={{ containerType: 'inline-size', inlineSize: '100%' }}>
				<Bleed
					data-testid="bleed"
					inline="sp16"
					inlineStart={{ initial: emptyValue, bp768: 'sp8' }}
				>
					Content
				</Bleed>
			</div>,
		);
		const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

		expect(getComputedStyle(bleed).marginInlineStart).toBe('-16px');

		await page.viewport(breakpoints.bp768, 800);
		expect(getComputedStyle(bleed).marginInlineStart).toBe('-8px');
	});
}

test('falls back to the axis value where a responsive edge value omits a breakpoint', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ containerType: 'inline-size', inlineSize: '100%' }}>
			<Bleed data-testid="bleed" inline="sp16" inlineStart={{ bp768: 'sp8' }}>
				Content
			</Bleed>
		</div>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

	expect(getComputedStyle(bleed).marginInlineStart).toBe('-16px');

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('-8px');
});

test('a direct edge value overrides only the initial axis value', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<div style={{ containerType: 'inline-size', inlineSize: '100%' }}>
			<Bleed data-testid="bleed" inline={{ initial: 'sp16', bp768: 'sp32' }} inlineStart="sp8">
				Content
			</Bleed>
		</div>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

	expect(getComputedStyle(bleed).marginInlineStart).toBe('-8px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('-16px');

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(bleed).marginInlineStart).toBe('-32px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('-32px');
});

test('reports an invalid value against the prop that received it', () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

	render(
		// @ts-expect-error — a JavaScript caller can still pass a raw CSS length
		<Bleed inline="16px" inlineStart="sp8">
			Content
		</Bleed>,
	);

	expect(consoleError).toHaveBeenCalled();
	for (const call of consoleError.mock.calls) {
		expect(call[0]).toContain("'inline'");
		expect(call[0]).toContain('spacing token');
	}

	consoleError.mockRestore();
});

test('reports an invalid all value against all', () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

	render(
		// @ts-expect-error — a JavaScript caller can still pass a raw CSS length
		<Bleed all="16px">Content</Bleed>,
	);

	expect(consoleError).toHaveBeenCalled();
	for (const call of consoleError.mock.calls) {
		expect(call[0]).toContain("'all'");
		expect(call[0]).toContain('spacing token');
	}

	consoleError.mockRestore();
});

test('zero overrides a lower-priority margin', () => {
	const { locator } = render(
		<div>
			<style>{'@layer base { [data-margin-fixture] { margin-inline: 12px; } }'}</style>
			<Bleed data-margin-fixture="" data-testid="control">
				Control
			</Bleed>
			<Bleed
				inline="0"
				renderRoot={(domProps) => {
					return <div {...domProps} data-margin-fixture="" data-testid="bleed" />;
				}}
			>
				Content
			</Bleed>
		</div>,
	);
	const control = expectHtmlElement(locator.getByTestId('control').element());
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());

	expect(getComputedStyle(control).marginInlineStart).toBe('12px');
	expect(getComputedStyle(bleed).marginInlineStart).toBe('0px');
	expect(getComputedStyle(bleed).marginInlineEnd).toBe('0px');
});

test('keeps ordinary non-margin layout props', () => {
	const { locator } = render(
		<Bleed data-testid="bleed" inline="sp8" padding="sp12" position="relative">
			Content
		</Bleed>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const style = getComputedStyle(bleed);

	expect(style.marginInlineStart).toBe('-8px');
	expect(style.paddingTop).toBe('12px');
	expect(style.position).toBe('relative');
});

test('keeps inline-start bleed on the physical inline-start side under RTL', () => {
	const { locator } = render(
		<div
			data-testid="parent"
			dir="rtl"
			style={{ inlineSize: '200px', paddingInline: vars.space.sp32 }}
		>
			<Bleed data-testid="bleed" inlineStart="sp32">
				Content
			</Bleed>
		</div>,
	);
	const parent = expectHtmlElement(locator.getByTestId('parent').element());
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const parentBox = parent.getBoundingClientRect();
	const bleedBox = bleed.getBoundingClientRect();

	expect(getComputedStyle(bleed).direction).toBe('rtl');
	expect(bleedBox.right).toBeCloseTo(parentBox.right, 1);
	expect(bleedBox.left).toBeGreaterThan(parentBox.left + 1);
});

test('maps block-start bleed under a vertical writing mode', () => {
	const { locator } = render(
		<div
			data-testid="parent"
			style={{
				paddingBlock: vars.space.sp16,
				writingMode: 'vertical-rl',
			}}
		>
			<Bleed blockStart="sp16" data-testid="bleed">
				Content
			</Bleed>
		</div>,
	);
	const parent = expectHtmlElement(locator.getByTestId('parent').element());
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const parentBox = parent.getBoundingClientRect();
	const bleedBox = bleed.getBoundingClientRect();

	expect(getComputedStyle(bleed).writingMode).toBe('vertical-rl');
	// In vertical-rl, block-start is the physical right edge.
	expect(bleedBox.right).toBeCloseTo(parentBox.right, 1);
	expect(getComputedStyle(bleed).marginBlockStart).toBe('-16px');
});

test('supports semantic and caller-owned elements', () => {
	const semantic = render(
		<Bleed aria-label="Bleed region" elementType="section" inline="sp16">
			Section content
		</Bleed>,
	);
	expect(semantic.locator.getByRole('region', { name: 'Bleed region' }).element().tagName).toBe(
		'SECTION',
	);

	const custom = render(
		<Bleed
			inline="sp16"
			renderRoot={(domProps) => <aside {...domProps} data-testid="custom-bleed" />}
		>
			Custom content
		</Bleed>,
	);
	const element = expectHtmlElement(custom.locator.getByTestId('custom-bleed').element());
	expect(element.tagName).toBe('ASIDE');
	expect(getComputedStyle(element).marginInlineStart).toBe('-16px');
});

test('keeps consumer className and style alongside bleed presentation', () => {
	const { locator } = render(
		<Bleed
			className="consumer-bleed"
			data-testid="bleed"
			inline="sp16"
			style={{ backgroundColor: 'rgb(1, 2, 3)', position: 'relative' }}
		>
			Content
		</Bleed>,
	);
	const bleed = expectHtmlElement(locator.getByTestId('bleed').element());
	const style = getComputedStyle(bleed);

	expect(bleed.className.split(/\s+/)).toContain('consumer-bleed');
	expect(style.marginInlineStart).toBe('-16px');
	expect(style.marginInlineEnd).toBe('-16px');
	expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
	expect(style.position).toBe('relative');
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div
				style={{
					backgroundColor: vars.color.surface.subdued,
					borderRadius: vars.radius.surface,
					display: 'flex',
					flexDirection: 'column',
					gap: vars.space.sp16,
					padding: vars.space.sp24,
				}}
			>
				<Box
					backgroundColor="surface.base"
					borderColor="decorative"
					borderRadius="detail"
					borderStyle="solid"
					borderWidth="thin"
					padding="sp16"
				>
					<Text>Inset</Text>
					<Bleed inline="sp16">
						<Box backgroundColor="accent.subtle.rest" borderRadius="detail" padding="sp12">
							<Text>Bleed inline</Text>
						</Box>
					</Bleed>
				</Box>
				<Box
					backgroundColor="surface.base"
					borderColor="decorative"
					borderRadius="detail"
					borderStyle="solid"
					borderWidth="thin"
					padding="sp16"
				>
					<Bleed all="sp8" inlineStart="sp16">
						<Box backgroundColor="accent.subtle.rest" borderRadius="detail" padding="sp12">
							<Text>Bleed edges</Text>
						</Box>
					</Bleed>
				</Box>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'bleed/kitchen-sink', appearance);
	}
});

function expectHtmlElement(element: Element | null): HTMLElement {
	if (!(element instanceof HTMLElement)) throw new Error('Expected an HTMLElement.');
	return element;
}
