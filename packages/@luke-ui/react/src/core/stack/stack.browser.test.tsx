import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../../theme/breakpoints.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

afterEach(async () => {
	await page.viewport(1024, 800);
});

test('flows children on the block axis with no gap by default', () => {
	const { locator } = render(
		<Stack data-testid="stack">
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');

	expect(getComputedStyle(element).display).toBe('flex');
	expect(getComputedStyle(element).flexDirection).toBe('column');
	expect(getComputedStyle(element).alignItems).toBe('stretch');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Stack children.');
	}

	expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(0);
});

test('keeps the block axis under RTL', () => {
	const { locator } = render(
		<div dir="rtl" style={{ blockSize: '6rem' }}>
			<Stack data-testid="stack-rtl" gap="sp8">
				<span style={{ blockSize: '1rem' }} />
				<span style={{ blockSize: '1rem' }} />
			</Stack>
		</div>,
	);
	const rtl = locator.getByTestId('stack-rtl').element();
	if (!(rtl instanceof HTMLElement)) throw new Error('Expected Stack element.');

	expect(getComputedStyle(rtl).flexDirection).toBe('column');

	const [rtlFirst, rtlSecond] = rtl.children;
	if (!(rtlFirst instanceof HTMLElement) || !(rtlSecond instanceof HTMLElement)) {
		throw new Error('Expected Stack children.');
	}

	expect(rtlSecond.getBoundingClientRect().top).toBeGreaterThan(
		rtlFirst.getBoundingClientRect().top,
	);
});

test('applies a responsive gap from its required initial value', async () => {
	await page.viewport(breakpoints.bp640, 800);
	const { locator } = render(
		<Stack data-testid="stack" gap={{ initial: '0', bp768: 'sp8' }}>
			<span style={{ blockSize: '1rem' }} />
			<span style={{ blockSize: '1rem' }} />
		</Stack>,
	);
	const element = locator.getByTestId('stack').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected Stack element.');
	const [first, second] = element.children;
	if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
		throw new Error('Expected Stack children.');
	}

	expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(0);

	await page.viewport(breakpoints.bp768, 800);
	expect(second.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().bottom);
});

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	borderRadius: vars.radius.detail,
	color: vars.color.text.primary,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
} as const;

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.sp16 }}>
				<Stack
					gap="sp12"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Block axis</span>
					<span style={itemStyle}>Required gap</span>
				</Stack>
				<Stack
					alignItems="center"
					gap="sp8"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Aligned</span>
					<span style={itemStyle}>Items</span>
				</Stack>
				<Stack
					elementType="section"
					gap="0"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
						color: vars.color.text.primary,
						padding: vars.space.sp16,
					}}
				>
					<span style={itemStyle}>Touching</span>
					<span style={itemStyle}>Items</span>
				</Stack>
				<div dir="rtl">
					<Stack
						gap="sp8"
						style={{
							backgroundColor: vars.color.surface.recessed,
							borderRadius: vars.radius.surface,
							color: vars.color.text.primary,
							padding: vars.space.sp16,
						}}
					>
						<span style={itemStyle}>First</span>
						<span style={itemStyle}>Second</span>
					</Stack>
				</div>
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'stack/kitchen-sink', appearance);
	}
});
