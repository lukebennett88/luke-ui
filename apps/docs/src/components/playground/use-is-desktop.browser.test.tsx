import { act } from 'react';
import type { Root } from 'react-dom/client';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { PLAYGROUND_DESKTOP_BREAKPOINT, useIsDesktop } from './use-is-desktop';

let roots: Array<Root> = [];
let containers: Array<HTMLElement> = [];

/**
 * Mirrors real usage in the playground route: `isDesktop ? 'horizontal' : 'vertical'`,
 * rendered as the component's only text content.
 */
function Host() {
	const isDesktop = useIsDesktop();
	return isDesktop ? 'horizontal' : 'vertical';
}

/** Puts server-rendered markup into a detached container, then hydrates it. */
function hydrate(serverHtml: string) {
	const container = document.body.appendChild(document.createElement('div'));
	containers.push(container);
	container.innerHTML = serverHtml;
	// Not wrapped in `act()`: the point of this test is to observe the raw,
	// pre-effect state of the very first hydrated paint, before React flushes
	// the effect that corrects the snapshot to the real root inline size.
	const root = hydrateRoot(container, <Host />);
	roots.push(root);
	return container;
}

afterEach(async () => {
	act(() => roots.forEach((root) => root.unmount()));
	roots = [];
	containers.forEach((container) => container.remove());
	containers = [];
	await page.viewport(1024, 800);
});

test('server snapshot renders the mobile layout, matching a static prerender', () => {
	// No window involved: this exercises `getServerSnapshot()` directly.
	const html = renderToStaticMarkup(<Host />);

	expect(html).toBe('vertical');
});

test('hydrating on a desktop-width viewport starts with the server orientation, then corrects it', async () => {
	await page.viewport(PLAYGROUND_DESKTOP_BREAKPOINT + 64, 800);
	const serverHtml = renderToStaticMarkup(<Host />);

	const container = hydrate(serverHtml);

	// The first hydrated value must match the server snapshot. Responsive CSS
	// supplies the visible desktop layout until this hook corrects the behaviour.
	expect(container.textContent).toBe('vertical');

	// Flush the effect that re-checks the root container's inline size.
	await act(async () => {});

	expect(container.textContent).toBe('horizontal');
});

test('hydrating on a mobile-width viewport shows no flash and stays vertical after mount', async () => {
	await page.viewport(PLAYGROUND_DESKTOP_BREAKPOINT - 64, 800);
	const serverHtml = renderToStaticMarkup(<Host />);

	const container = hydrate(serverHtml);

	expect(container.textContent).toBe('vertical');

	await act(async () => {});

	expect(container.textContent).toBe('vertical');
});
