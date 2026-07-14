import { act } from 'react';
import type { Root } from 'react-dom/client';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test } from 'vite-plus/test';
import { DESKTOP_MEDIA_QUERY, useIsDesktop } from './use-is-desktop';

let roots: Array<Root> = [];
let containers: Array<HTMLElement> = [];
let originalMatchMedia: typeof window.matchMedia | undefined;

/**
 * Mirrors real usage in the playground route: `isDesktop ? 'horizontal' : 'vertical'`,
 * rendered as the component's only text content.
 */
function Host() {
	const isDesktop = useIsDesktop();
	return isDesktop ? 'horizontal' : 'vertical';
}

/** Fakes `window.matchMedia` for the desktop breakpoint the hook queries. */
function stubMatchMedia(matches: boolean) {
	originalMatchMedia = window.matchMedia;
	window.matchMedia = ((query: string) => {
		return {
			matches: query === DESKTOP_MEDIA_QUERY && matches,
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		} as unknown as MediaQueryList;
	}) as typeof window.matchMedia;
}

/** Puts server-rendered markup into a detached container, then hydrates it. */
function hydrate(serverHtml: string) {
	const container = document.body.appendChild(document.createElement('div'));
	containers.push(container);
	container.innerHTML = serverHtml;
	// Not wrapped in `act()`: the point of this test is to observe the raw,
	// pre-effect state of the very first hydrated paint, before React flushes
	// the effect that corrects the snapshot to the real `matchMedia` result.
	const root = hydrateRoot(container, <Host />);
	roots.push(root);
	return container;
}

afterEach(() => {
	act(() => roots.forEach((root) => root.unmount()));
	roots = [];
	containers.forEach((container) => container.remove());
	containers = [];
	if (originalMatchMedia) window.matchMedia = originalMatchMedia;
});

test('server snapshot renders the mobile layout, matching a static prerender', () => {
	// No window/matchMedia involved: this exercises `getServerSnapshot()` directly.
	const html = renderToStaticMarkup(<Host />);

	expect(html).toBe('vertical');
});

test('hydrating on a desktop-width viewport starts with the server orientation, then corrects it', async () => {
	const serverHtml = renderToStaticMarkup(<Host />);
	stubMatchMedia(true);

	const container = hydrate(serverHtml);

	// The first hydrated value must match the server snapshot. Responsive CSS
	// supplies the visible desktop layout until this hook corrects the behaviour.
	expect(container.textContent).toBe('vertical');

	// Flush the effect that re-checks the real `matchMedia` result.
	await act(async () => {});

	expect(container.textContent).toBe('horizontal');
});

test('hydrating on a mobile-width viewport shows no flash and stays vertical after mount', async () => {
	const serverHtml = renderToStaticMarkup(<Host />);
	stubMatchMedia(false);

	const container = hydrate(serverHtml);

	expect(container.textContent).toBe('vertical');

	await act(async () => {});

	expect(container.textContent).toBe('vertical');
});
