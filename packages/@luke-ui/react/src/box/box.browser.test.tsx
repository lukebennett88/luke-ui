import '../../dist/themes/tactile.css';
import '../stylesheet.css.js';
import { act, createRef } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { Box } from './index.js';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

afterEach(async () => {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;
	await page.viewport(1024, 800);
});

test('renders a responsive layout at the retained breakpoints', async () => {
	const container = document.body.appendChild(document.createElement('div'));
	container.className = `${themeRootClassName} ${tactileThemeClassName}`;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(
			<Box
				display="flex"
				flexDirection={{ medium: 'row', xsmall: 'column' }}
				gap={{ medium: '600', xsmall: '200' }}
			>
				<span>First item</span>
				<span>Second item</span>
			</Box>,
		);
	});

	const box = container.firstElementChild;
	if (!(box instanceof HTMLElement)) throw new Error('Expected Box element.');

	await page.viewport(640, 800);
	expect(getComputedStyle(box).flexDirection).toBe('column');
	expect(getComputedStyle(box).gap).toBe('8px');

	await page.viewport(768, 800);
	expect(getComputedStyle(box).flexDirection).toBe('row');
	expect(getComputedStyle(box).gap).toBe('24px');
});

test('forwards the ref through a custom rendered div', () => {
	const container = document.body.appendChild(document.createElement('div'));
	const root = createRoot(container);
	const ref = createRef<HTMLDivElement>();
	mounted.push({ container, root });

	act(() => {
		root.render(
			<Box
				id="custom-div"
				ref={ref}
				render={(domProps) => <div data-motion="enabled" {...domProps} />}
			>
				Custom div
			</Box>,
		);
	});

	const div = container.firstElementChild;
	if (!(div instanceof HTMLDivElement)) throw new Error('Expected custom rendered div.');

	expect(ref.current).toBe(div);
	expect(div).toHaveAttribute('data-motion', 'enabled');
	expect(div).toHaveAttribute('id', 'custom-div');
	expect(div).toHaveTextContent('Custom div');
});

test('keeps arbitrary dynamic values in Box CSS variables', () => {
	const container = document.body.appendChild(document.createElement('div'));
	container.className = `${themeRootClassName} ${tactileThemeClassName}`;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(<Box inlineSize="calc(100% - 2rem)" padding="400" />);
	});

	const box = container.firstElementChild;
	if (!(box instanceof HTMLElement)) throw new Error('Expected Box element.');

	expect(box.style.getPropertyValue('--box-inline-size')).toBe('calc(100% - 2rem)');
	expect(getComputedStyle(box).inlineSize).toBe(`${document.body.clientWidth - 32}px`);
	expect(getComputedStyle(box).padding).toBe('16px');
});
