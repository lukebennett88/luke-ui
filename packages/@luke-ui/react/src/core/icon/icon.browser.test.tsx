import { Box } from '@luke-ui/react/box';
import { createIcon, Icon, IconSizeProvider } from '@luke-ui/react/icon';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedTokens, resolvedColor } from '../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	Stack,
	variantValuesFor,
} from '../test-utils/visual.js';

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} satisfies CSSProperties;

const sizes = variantValuesFor<typeof Icon, 'size'>()(['xsmall', 'small', 'medium', 'large']);
const names = variantValuesFor<typeof Icon, 'name'>()([
	'add',
	'checkCircle',
	'closeCircle',
	'externalLink',
	'search',
]);

const CustomIcon = createIcon({ path: <path d="M0 0h1v1H0z" /> });

test('icon and spinner sizes use the explicit size, then context, then the default', () => {
	const { locator } = render(
		<>
			<Icon name="add" title="Default icon" />
			<LoadingSpinner aria-label="Default spinner" />
			<IconSizeProvider size="small">
				<CustomIcon title="Context icon" />
				<LoadingSpinner aria-label="Context spinner" />
				<Icon name="add" size="xsmall" title="Explicit icon" />
				<LoadingSpinner aria-label="Explicit spinner" size="large" />
				<IconSizeProvider size="large">
					<Icon name="add" title="Nested icon" />
					<LoadingSpinner aria-label="Nested spinner" />
				</IconSizeProvider>
			</IconSizeProvider>
		</>,
	);

	for (const [role, name, size] of [
		['img', 'Default icon', 24],
		['status', 'Default spinner', 24],
		['img', 'Context icon', 20],
		['status', 'Context spinner', 20],
		['img', 'Explicit icon', 16],
		['status', 'Explicit spinner', 32],
		['img', 'Nested icon', 32],
		['status', 'Nested spinner', 32],
	] as const) {
		const element = locator.getByRole(role, { name }).element();
		expect(getComputedStyle(element).inlineSize).toBe(`${size}px`);
		expect(getComputedStyle(element).blockSize).toBe(`${size}px`);
	}
});

for (const [size, pixels] of [
	['xsmall', 16],
	['small', 20],
	['medium', 24],
	['large', 32],
] as const) {
	test(`Icon and LoadingSpinner share the ${size} dimensions`, () => {
		const { locator } = render(
			<>
				<Icon name="add" size={size} title="Icon" />
				<LoadingSpinner aria-label="Spinner" size={size} />
			</>,
		);
		for (const [role, name] of [
			['img', 'Icon'],
			['status', 'Spinner'],
		] as const) {
			const style = getComputedStyle(locator.getByRole(role, { name }).element());
			expect(style.inlineSize).toBe(`${pixels}px`);
			expect(style.blockSize).toBe(`${pixels}px`);
		}
	});
}

function IconScene() {
	return (
		<Stack>
			<div style={rowStyle}>
				{sizes.map((size) => (
					<Icon key={size} name="add" size={size} title={`Add ${size}`} />
				))}
			</div>
			<div style={rowStyle}>
				{names.map((name) => (
					<Icon key={name} name={name} title={name} />
				))}
			</div>
		</Stack>
	);
}

test('the Icon scene has no axe violations', async () => {
	const { container } = render(<IconScene />);

	await expectNoAxeViolations(container);
});

test('sizes and glyphs', { tags: ['visual'] }, async () => {
	const { locator } = render(<IconScene />);

	await captureVisual(locator, 'icon/sizes-glyphs');
});

test('semantic content inheritance', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<div style={{ color: vars.color.foreground.accent.rest }}>
				<Icon name="checkCircle" title="Inherited accent" />
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'icon/content-inheritance', appearance);
	}
});

for (const appearance of visualAppearances) {
	test(`Icon paints in the surrounding contextual colour in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<>
				<Box backgroundColor="accent.solid">
					<Icon id="on-solid-icon" name="add" />
				</Box>
				<Box backgroundColor="warning.subtle">
					<Text color="danger" data-testid="danger-text">
						<Icon name="closeCircle" />
					</Text>
				</Box>
			</>,
			{ appearance },
		);
		const onSolid = container.querySelector('#on-solid-icon');
		const dangerText = container.querySelector('[data-testid="danger-text"]');
		const dangerIcon = dangerText?.querySelector('svg');
		if (!(onSolid instanceof SVGElement) || !(dangerIcon instanceof SVGElement)) {
			throw new Error('Expected both icons.');
		}

		expect(getComputedStyle(onSolid).fill).toBe(
			resolvedColor(pairedTokens('accent.solid.rest').primary, onSolid.parentElement!),
		);
		expect(getComputedStyle(dangerIcon).fill).toBe(
			resolvedColor(pairedTokens('warning.subtle').danger, dangerText!),
		);
	});
}
