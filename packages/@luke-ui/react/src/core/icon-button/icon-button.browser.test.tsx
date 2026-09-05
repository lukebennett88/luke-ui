import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { Icon } from '../icon/icon.js';
import { render } from '../test-utils/render.js';
import { IconButton } from './icon-button.js';

testConformance({
	path: 'icon-button',
	getTarget: (result) => {
		const target = result.locator.getByRole('button', { name: 'Add' }).element();
		if (!(target instanceof HTMLElement)) throw new Error('Expected an icon button.');
		return target;
	},
	render: (props = {}) => {
		return render(<IconButton {...props} aria-label="Add" icon="add" />);
	},
});

testIntegration('icon-button', async () => {
	let pressed = false;
	const { locator, user } = render(
		<IconButton aria-label="Add" icon="add" onPress={() => (pressed = true)} />,
	);

	await user.click(locator.getByRole('button', { name: 'Add' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(pressed).toBe(true);
});

// `IconButton` composes `Button` through its public `xstyle` prop
// (`xstyle={[styles.reset, sizeStyles[size], xstyle]}`) rather than a package-private renderer.
// These tests prove that composition's precedence, in ascending priority: Button's own recipe
// styles, IconButton's reset (squares the control, drops horizontal padding), IconButton's
// selected size, then a consumer `xstyle`, then inline `style`.
const consumerStyles = stylex.create({
	background: { backgroundColor: 'rgb(1, 2, 3)' },
	inlineSize: { inlineSize: '96px' },
});

test("Button's own recipe styles still apply", () => {
	const { locator } = render(<IconButton aria-label="Add" icon="add" />);
	const target = locator.getByRole('button', { name: 'Add' }).element() as HTMLElement;
	// `borderRadius: vars.radius.control` comes from Button's own recipe base style.
	expect(getComputedStyle(target).borderRadius).not.toBe('0px');
});

test("IconButton's reset beats Button's horizontal padding", () => {
	const { locator } = render(<IconButton aria-label="Add" icon="add" />);
	const target = locator.getByRole('button', { name: 'Add' }).element() as HTMLElement;
	expect(getComputedStyle(target).paddingInline).toBe('0px');
});

test("IconButton's selected size beats Button's geometry", () => {
	const { locator } = render(<IconButton aria-label="Add" icon="add" size="small" />);
	const target = locator.getByRole('button', { name: 'Add' }).element() as HTMLElement;
	const computed = getComputedStyle(target);
	// A squared small icon button's inline size matches its (Button-recipe-driven) block size,
	// not Button's own wider default inline sizing for text buttons.
	expect(computed.inlineSize).toBe(computed.blockSize);
});

test("consumer xstyle beats IconButton's internal styles", () => {
	const { locator } = render(
		<IconButton aria-label="Add" icon="add" xstyle={consumerStyles.inlineSize} />,
	);
	const target = locator.getByRole('button', { name: 'Add' }).element() as HTMLElement;
	expect(getComputedStyle(target).inlineSize).toBe('96px');
});

test('inline style still wins over everything', () => {
	const { locator } = render(
		<IconButton
			aria-label="Add"
			icon="add"
			style={{ backgroundColor: 'rgb(4, 5, 6)' }}
			xstyle={consumerStyles.background}
		/>,
	);
	const target = locator.getByRole('button', { name: 'Add' }).element() as HTMLElement;
	expect(getComputedStyle(target).backgroundColor).toBe('rgb(4, 5, 6)');
});

test('isPending reaches RAC and the icon gets opacity 0', () => {
	const { locator } = render(<IconButton aria-label="Add" icon="add" isPending />);
	const target = locator.getByRole('button', { name: 'Add' }).element() as HTMLElement;
	expect(target).toHaveAttribute('data-pending', 'true');

	const icon = target.querySelector('svg') as SVGElement;
	expect(getComputedStyle(icon).opacity).toBe('0');
});

test("icon sizing via Button's IconSizeProvider is unchanged", () => {
	const rendered = render(<IconButton aria-label="Add" icon="add" />);
	const iconInButton = rendered.container.querySelector('svg') as SVGElement;

	// `xsmall` is `BUTTON_ICON_SIZE`, the size Button's `IconSizeProvider` supplies. An `Icon`
	// rendered directly with that same explicit size should compute to the same inline size.
	const directIcon = render(<Icon aria-hidden name="add" size="xsmall" />);
	const iconDirect = directIcon.container.querySelector('svg') as SVGElement;

	expect(getComputedStyle(iconInButton).inlineSize).toBe(getComputedStyle(iconDirect).inlineSize);
});
