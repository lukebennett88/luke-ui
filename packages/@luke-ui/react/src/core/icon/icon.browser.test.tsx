import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import type { CustomIconProps, IconRecipeVariants } from '@luke-ui/react/icon';
import { createIcon, Icon, iconRecipe, iconSizeVars } from '@luke-ui/react/icon';
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

type IconSize = NonNullable<IconRecipeVariants>['size'];

const sizes = variantValuesFor<typeof Icon, 'size'>()(['xsmall', 'small', 'medium', 'large']);
const names = variantValuesFor<typeof Icon, 'name'>()([
	'add',
	'checkCircle',
	'closeCircle',
	'externalLink',
	'search',
]);

const SquareIcon = createIcon({ path: <path d="M0 0h1v1H0z" /> });

/** One of each sizable kind, named so each scope's members can be found by role. */
function SizedSet({ label, size }: { label: string; size?: IconSize }) {
	return (
		<>
			<Icon name="add" size={size} title={`${label} icon`} />
			<SquareIcon size={size} title={`${label} custom icon`} />
			<LoadingSpinner aria-label={`${label} spinner`} size={size} />
			<svg
				aria-label={`${label} recipe svg`}
				className={iconRecipe({ size })}
				role="img"
				viewBox="0 0 24 24"
			/>
		</>
	);
}

test('icons and spinners take an explicit size, then the nearest scope, then the default', () => {
	const { locator } = render(
		<>
			<SizedSet label="Default" />
			<Button>
				<SizedSet label="Button" />
			</Button>
			<div style={iconSizeVars('large')}>
				<SizedSet label="Outer" />
				<div style={iconSizeVars('small')}>
					<SizedSet label="Nested" />
					<SizedSet label="Explicit" size="xsmall" />
				</div>
			</div>
			<div style={{ '--luke-icon-size': '40px' } as CSSProperties}>
				<SizedSet label="Length" />
			</div>
		</>,
	);

	for (const [label, pixels] of [
		['Default', 24],
		['Button', 16],
		['Outer', 32],
		['Nested', 20],
		['Explicit', 16],
		['Length', 40],
	] as const) {
		for (const [role, name] of [
			['img', `${label} icon`],
			['img', `${label} custom icon`],
			['status', `${label} spinner`],
			['img', `${label} recipe svg`],
		] as const) {
			const style = getComputedStyle(locator.getByRole(role, { name }).element());
			expect({ name, size: style.inlineSize }).toEqual({ name, size: `${pixels}px` });
			expect({ name, size: style.blockSize }).toEqual({ name, size: `${pixels}px` });
		}
	}
});

test('createIcon renders an SVG that a title names and that is hidden otherwise', () => {
	const { container, locator } = render(
		<>
			<SquareIcon title="Square" />
			<SquareIcon />
			<SquareIcon aria-hidden title="Hidden square" />
			<SquareIcon aria-hidden={false} />
		</>,
	);
	const named = locator.getByRole('img', { name: 'Square' }).element();
	const svgs = [...container.querySelectorAll('svg')];

	expect(named.tagName).toBe('svg');
	expect(named.querySelector('title')?.textContent).toBe('Square');
	expect(named.getAttribute('aria-hidden')).toBeNull();
	expect(named.getAttribute('fill')).toBe('currentColor');
	expect(named.getAttribute('focusable')).toBe('false');
	for (const svg of svgs.slice(1)) {
		expect(svg.getAttribute('aria-hidden')).toBe('true');
		expect(svg.getAttribute('role')).toBeNull();
	}
});

test('createIcon resolves the viewBox from the prop, then the option, then the icon grid', () => {
	const GridIcon = createIcon({ path: <path d="M0 0h1v1H0z" /> });
	const WideIcon = createIcon({ path: <path d="M0 0h1v1H0z" />, viewBox: '0 0 48 24' });
	const { container } = render(
		<>
			<GridIcon id="grid" />
			<WideIcon id="wide" />
			<WideIcon id="override" viewBox="0 0 12 12" />
		</>,
	);

	expect(container.querySelector('#grid')?.getAttribute('viewBox')).toBe('0 0 24 24');
	expect(container.querySelector('#wide')?.getAttribute('viewBox')).toBe('0 0 48 24');
	expect(container.querySelector('#override')?.getAttribute('viewBox')).toBe('0 0 12 12');
});

test('createIcon passes custom props to path and viewBox functions', () => {
	const ArrowIcon = createIcon<CustomIconProps & { direction: 'down' | 'up' }>({
		path: ({ direction }) => <path d={direction === 'up' ? 'M0 1h1' : 'M0 0h1'} />,
		viewBox: ({ direction }) => (direction === 'up' ? '0 0 16 16' : undefined),
	});
	const { container } = render(
		<>
			<ArrowIcon className="custom" direction="up" id="up" style={{ opacity: 0.5 }} />
			<ArrowIcon direction="down" id="down" />
		</>,
	);
	const up = container.querySelector('#up')!;

	expect(up.querySelector('path')?.getAttribute('d')).toBe('M0 1h1');
	expect(up.getAttribute('viewBox')).toBe('0 0 16 16');
	expect(up.classList.contains('custom')).toBe(true);
	expect(getComputedStyle(up).opacity).toBe('0.5');
	expect(container.querySelector('#down path')?.getAttribute('d')).toBe('M0 0h1');
	// A viewBox function that returns nothing leaves the SVG without one.
	expect(container.querySelector('#down')?.getAttribute('viewBox')).toBeNull();
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
