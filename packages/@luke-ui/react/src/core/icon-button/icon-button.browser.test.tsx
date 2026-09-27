import { IconButton } from '@luke-ui/react/icon-button';
import type { JSX } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
} from '../test-utils/visual.js';

/** Intended Action spinner delay (~300ms). Kept in the test so production timing drifts fail. */
const ACTION_SPINNER_DELAY_MS = 300;

/** A custom SVG that deliberately omits its own `aria-hidden` and any `<title>`. */
function UnlabelledCustomIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="8" fill="currentColor" />
		</svg>
	);
}

function IconButtonScene() {
	return (
		<Grid columns={4}>
			<IconButton aria-label="Add small" icon="add" size="small" />
			<IconButton aria-label="Add medium" icon="add" size="medium" />
			<IconButton aria-label="Disabled" icon="delete" isDisabled size="small" />
			<IconButton aria-label="Pending" icon="add" isPending size="medium" />
			<IconButton aria-label="Standard" icon="add" />
			<IconButton aria-label="Low" icon="add" prominence="low" />
			<IconButton aria-label="High" icon="add" prominence="high" />
			<IconButton aria-label="Critical high" icon="delete" tone="critical" prominence="high" />
		</Grid>
	);
}

test('pressing an IconButton runs its onPress handler', async () => {
	let pressed = false;
	const { locator, user } = render(
		<IconButton aria-label="Add" icon="add" onPress={() => (pressed = true)} />,
	);

	await user.click(locator.getByRole('button', { name: 'Add' }));
	expect(pressed).toBe(true);
});

test('the IconButton scene has no axe violations', async () => {
	const { container } = render(<IconButtonScene />);

	await expectNoAxeViolations(container);
});

test('a built-in icon contributes no accessible name', () => {
	const { locator } = render(<IconButton aria-label="Repository" icon="search" />);

	expect(locator.getByRole('button', { name: 'Repository' }).element()).toBeTruthy();
	expect(locator.getByRole('button', { name: 'search' }).query()).toBeNull();
});

test('a custom SVG icon with no aria-hidden of its own contributes no accessible name', () => {
	const { locator } = render(<IconButton aria-label="Brand" icon={<UnlabelledCustomIcon />} />);

	const button = locator.getByRole('button', { name: 'Brand' }).element();
	expect(button).toHaveAccessibleName('Brand');
	// The wrapper hides the whole subtree, so the custom svg needs no aria-hidden of its own.
	expect(button.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
});

test('shares Action pending timing with Button', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});

	const { locator, user } = render(
		<IconButton
			aria-label="Save"
			icon="check"
			pressAction={async () => {
				await gate;
			}}
		/>,
	);
	const button = locator.getByRole('button', { name: 'Save' });

	await user.click(button);
	expect(button.element().getAttribute('data-pending')).toBe('true');
	expect(button.element().querySelector('[role="status"]')).toBeNull();

	await delay(ACTION_SPINNER_DELAY_MS - 50);
	expect(button.element().querySelector('[role="status"]')).toBeNull();

	await delay(150);
	expect(button.element().querySelector('[role="status"]')).not.toBeNull();

	release();
	await expect.poll(() => button.element().getAttribute('data-pending')).toBeNull();
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<IconButtonScene />, { appearance });
		await captureVisualAppearance(locator, 'icon-button/kitchen-sink', appearance);
	}
});

test('focus-visible state', { tags: ['visual'] }, async () => {
	const { locator } = render(<IconButton aria-label="Action" icon="add" />);

	await focusViaKeyboard(page.getByRole('button', { name: 'Action' }));
	await captureVisual(locator, 'icon-button/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={3}>
				<IconButton aria-label="Action" icon="add" />
				<IconButton aria-label="Disabled" icon="delete" isDisabled />
				<IconButton aria-label="Pending" icon="add" isPending />
			</Grid>,
		);
		await captureVisual(locator, 'icon-button/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}
