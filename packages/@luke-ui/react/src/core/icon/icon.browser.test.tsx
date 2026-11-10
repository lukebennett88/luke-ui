import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon, iconRecipe } from '@luke-ui/react/icon';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { emulateForcedColors } from '../test-utils/emulate-media.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedTokens, resolvedColor } from '../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	Stack,
	variantValuesFor,
} from '../test-utils/visual.js';

const ICON_MASK_PATTERN = /^url\("data:image\/svg\+xml,/;

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

test('icon and spinner sizes use the explicit size, then the container, then the default', () => {
	const { locator } = render(
		<>
			<Icon name="add" title="Default icon" />
			<LoadingSpinner aria-label="Default spinner" />
			<Button>
				<svg aria-label="Container icon" className={iconRecipe()} role="img" viewBox="0 0 24 24">
					<path d="M0 0h1v1H0z" />
				</svg>
				<LoadingSpinner aria-label="Container spinner" />
				<Icon name="add" size="large" title="Explicit icon" />
				<LoadingSpinner aria-label="Explicit spinner" size="small" />
			</Button>
		</>,
	);

	for (const [role, name, size] of [
		['img', 'Default icon', 24],
		['status', 'Default spinner', 24],
		['img', 'Container icon', 16],
		['status', 'Container spinner', 16],
		['img', 'Explicit icon', 32],
		['status', 'Explicit spinner', 20],
	] as const) {
		const element = locator.getByRole(role, { name }).element();
		expect(getComputedStyle(element).inlineSize).toBe(`${size}px`);
		expect(getComputedStyle(element).blockSize).toBe(`${size}px`);
	}
});

test('names an icon with a title and hides it otherwise', () => {
	const { container, locator } = render(
		<>
			<Icon name="search" title="Search" />
			<Icon name="search" />
			<Icon aria-hidden name="search" title="Hidden despite title" />
		</>,
	);

	expect(locator.getByRole('img', { name: 'Search' }).element().tagName).toBe('SPAN');
	const hidden = [...container.querySelectorAll('[data-icon="search"][aria-hidden="true"]')];
	expect(hidden).toHaveLength(2);
	for (const icon of hidden) {
		expect(icon.getAttribute('role')).toBeNull();
		expect(icon.getAttribute('aria-label')).toBeNull();
	}
});

test('the stylesheet paints each built-in icon from its own mask', () => {
	const { container } = render(
		<>
			<Icon name="add" />
			<Icon name="search" />
		</>,
	);
	const [add, search] = [...container.querySelectorAll('[data-icon]')].map((icon) => {
		return getComputedStyle(icon).maskImage;
	});

	expect(add).toMatch(ICON_MASK_PATTERN);
	expect(search).toMatch(ICON_MASK_PATTERN);
	expect(add).not.toBe(search);
});

test('an icon keeps its mask and size in a right-to-left context', () => {
	const { container } = render(
		<div dir="rtl">
			<Icon name="arrowRight" />
		</div>,
	);
	const style = getComputedStyle(container.querySelector('[data-icon]')!);

	// The mask does not mirror a directional glyph. Mirroring stays a per-icon decision.
	expect(style.maskImage).toMatch(ICON_MASK_PATTERN);
	expect(style.inlineSize).toBe('24px');
});

test('under forced colours an icon paints the forced colour around it, not the author colour', async () => {
	await emulateForcedColors('active');
	try {
		const { locator } = render(
			<>
				<Button>
					<Icon name="add" title="In button" />
					Add item
				</Button>
				<Box backgroundColor="danger.solid">
					<Text color="danger">
						<Icon name="closeCircle" title="In text" />
					</Text>
				</Box>
			</>,
		);
		const button = locator.getByRole('button').element();
		const inButton = locator.getByRole('img', { name: 'In button' }).element();
		const inText = locator.getByRole('img', { name: 'In text' }).element();

		expect(getComputedStyle(inButton).backgroundColor).toBe(resolvedColor('ButtonText', button));
		expect(getComputedStyle(inText).backgroundColor).toBe(
			resolvedColor('CanvasText', inText.parentElement!),
		);
	} finally {
		await emulateForcedColors('none');
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
		const dangerIcon = dangerText?.querySelector('[data-icon]');
		if (!(onSolid instanceof HTMLElement) || !(dangerIcon instanceof HTMLElement)) {
			throw new Error('Expected both icons.');
		}

		expect(getComputedStyle(onSolid).backgroundColor).toBe(
			resolvedColor(pairedTokens('accent.solid.rest').primary, onSolid.parentElement!),
		);
		expect(getComputedStyle(dangerIcon).backgroundColor).toBe(
			resolvedColor(pairedTokens('warning.subtle').danger, dangerText!),
		);
	});
}
