import '../../dist/themes/tactile.css';
import '../stylesheet.css.js';
import { act } from 'react';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import spritesheetHref from '../../dist/spritesheet.svg?url';
import { IconButton } from '../icon-button/index.js';
import { Icon, IconSpritesheetProvider } from '../icon/index.js';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { Button } from './index.js';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

afterEach(() => {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;
});

test('renders a 16px start icon in a medium button', () => {
	const { container } = mountFixture(
		<Button size="medium" startIcon={<Icon name="add" />}>
			Add
		</Button>,
	);

	const icon = container.querySelector('svg');
	if (!(icon instanceof SVGElement)) throw new Error('Expected icon.');

	const styles = getComputedStyle(icon);
	expect(styles.inlineSize).toBe('16px');
	expect(styles.blockSize).toBe('16px');
});

test('renders a 16px start icon in a small button', () => {
	const { container } = mountFixture(
		<Button size="small" startIcon={<Icon name="add" />}>
			Add
		</Button>,
	);

	const icon = container.querySelector('svg');
	if (!(icon instanceof SVGElement)) throw new Error('Expected icon.');

	const styles = getComputedStyle(icon);
	expect(styles.inlineSize).toBe('16px');
	expect(styles.blockSize).toBe('16px');
});

test('renders a 16px icon in a medium icon button while the button itself stays 40px', () => {
	const { container } = mountFixture(<IconButton aria-label="Add" icon="add" size="medium" />);

	const button = container.firstElementChild;
	if (!(button instanceof HTMLElement)) throw new Error('Expected button.');
	expect(getComputedStyle(button).inlineSize).toBe('40px');

	const icon = button.querySelector('svg');
	if (!(icon instanceof SVGElement)) throw new Error('Expected icon.');

	const styles = getComputedStyle(icon);
	expect(styles.inlineSize).toBe('16px');
	expect(styles.blockSize).toBe('16px');
});

test('an explicit icon size overrides the button-provided icon size', () => {
	const { container } = mountFixture(
		<Button size="medium" startIcon={<Icon name="add" size="large" />}>
			Add
		</Button>,
	);

	const icon = container.querySelector('svg');
	if (!(icon instanceof SVGElement)) throw new Error('Expected icon.');

	const styles = getComputedStyle(icon);
	expect(styles.inlineSize).toBe('32px');
	expect(styles.blockSize).toBe('32px');
});

// `startIcon` is typed `ReactNode`, so it can hold more than one top-level
// element, for example a compound icon. Each becomes its own item in the
// `buttonLabel` flex row (`button-composed.css.ts`), so this proves the second
// element renders beside the first and the label, not on top of it.
test('a start icon with two elements renders them side by side, not overlapping', () => {
	const { container } = mountFixture(
		<Button
			size="medium"
			startIcon={
				<>
					<Icon name="add" />
					<Icon name="check" />
				</>
			}
		>
			New task
		</Button>,
	);

	const icons = container.querySelectorAll('svg');
	const [first, second] = icons;
	if (!(first instanceof SVGElement) || !(second instanceof SVGElement)) {
		throw new Error('Expected both start icon elements.');
	}

	const firstRect = first.getBoundingClientRect();
	const secondRect = second.getBoundingClientRect();
	expect(firstRect.width).toBeGreaterThan(0);
	expect(secondRect.width).toBeGreaterThan(0);
	expect(secondRect.left).toBeGreaterThanOrEqual(firstRect.right);
});

function mountFixture(node: ReactNode) {
	const container = document.body.appendChild(document.createElement('div'));
	container.className = `${themeRootClassName} ${tactileThemeClassName}`;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(<IconSpritesheetProvider href={spritesheetHref}>{node}</IconSpritesheetProvider>);
	});

	return { container };
}
