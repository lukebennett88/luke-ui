import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { DocsSearchProvider, DocsSearchTrigger } from './search.js';

const { getSearchResults, MANY_RESULTS_COUNT } = vi.hoisted(() => {
	const MANY_RESULTS_COUNT = 40;

	function getSearchResults(search: string) {
		switch (search) {
			case 'button':
				return [
					{
						id: 'internal',
						url: '/docs/button#usage',
						type: 'page',
						content: 'Use the <mark>Button</mark> component <script>alert(1)</script>',
						breadcrumbs: ['Components', 'Actions'],
					},
					{
						id: 'heading',
						url: '/docs/button#props',
						type: 'heading',
						content: 'Props',
					},
					{
						id: 'code',
						url: '/docs/button#ref',
						type: 'text',
						content: 'Pass a `field.ref` with a <mark>ref</mark> callback',
					},
					{
						id: 'external',
						url: 'https://example.com/button',
						type: 'text',
						content: 'External <mark>Button</mark> reference',
					},
				] as const;
			case 'many':
				return Array.from({ length: MANY_RESULTS_COUNT }, (_, index) => ({
					id: `result-${index}`,
					url: `/docs/result-${index}`,
					type: 'page' as const,
					content: `Result ${index}`,
					breadcrumbs: ['Components', 'Actions'],
				}));
			default:
				return 'empty' as const;
		}
	}

	return { getSearchResults, MANY_RESULTS_COUNT };
});

vi.mock('fumadocs-core/search/client', async () => {
	const { useState } = await import('react');
	return {
		useDocsSearch: () => {
			const [search, setSearch] = useState('');
			return {
				search,
				setSearch,
				query: {
					isLoading: search === 'loading',
					error: search === 'error' ? new Error('Search failed') : null,
					data:
						search === 'loading' || search === 'error'
							? getSearchResults('button')
							: getSearchResults(search),
				},
			};
		},
	};
});

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

async function renderSearch() {
	const rootRoute = createRootRoute({
		component: () => (
			<IconSpritesheetProvider href={spriteSheetHref}>
				<DocsSearchProvider>
					<DocsSearchTrigger />
					<input aria-label="Editor" />
					<Outlet />
				</DocsSearchProvider>
			</IconSpritesheetProvider>
		),
	});
	const buttonRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/docs/button',
		component: () => <p>Button documentation</p>,
	});
	const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
	const router = createRouter({
		history: createMemoryHistory(),
		routeTree: rootRoute.addChildren([indexRoute, buttonRoute]),
	});
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
	return router;
}

async function openSearchDialog() {
	await userEvent.click(page.getByRole('button', { name: /Search documentation/ }));
	const input = page.getByRole('searchbox', { name: 'Search documentation' });
	await expect.element(input).toBeVisible();
	await expect.element(input).toHaveFocus();
	return input;
}

async function typeSearchQuery(input: ReturnType<typeof page.getByRole>, query: string) {
	await userEvent.type(input.element(), query, { skipClick: true });
	await expect.element(input).toHaveValue(query);
}

test('shows a platform-appropriate keyboard shortcut hint on the search trigger', async () => {
	await renderSearch();
	const trigger = page.getByRole('button', { name: /Search documentation/ });
	const shortcut = trigger.element().querySelector('kbd');
	if (!shortcut) throw new Error('Search shortcut label was not rendered.');
	const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
	expect(shortcut.textContent).toBe(isMac ? '⌘K' : 'Ctrl K');
});

test('opens the panel centred in the viewport', async () => {
	await renderSearch();
	await openSearchDialog();
	const dialog = page.getByRole('dialog', { name: 'Search documentation' });
	const panel = dialog.element().parentElement;
	if (!(panel instanceof HTMLElement)) throw new Error('Search panel was not rendered.');
	const panelBounds = panel.getBoundingClientRect();
	const viewportWidth = window.innerWidth;
	const panelCenterX = panelBounds.left + panelBounds.width / 2;
	expect(Math.abs(panelCenterX - viewportWidth / 2)).toBeLessThan(2);
	const maxTop = Math.min(window.innerHeight * 0.15, 8 * 16);
	expect(panelBounds.top).toBeLessThanOrEqual(maxTop + 1);
	expect(panelBounds.top).toBeGreaterThan(0);
});

test('shows a visible focus ring around the focused search input', async () => {
	await renderSearch();
	const input = await openSearchDialog();
	await expect.element(input).toHaveFocus();
	const group = input.element().parentElement;
	if (!group) throw new Error('Search input group was not rendered.');
	const groupStyle = getComputedStyle(group);
	expect(groupStyle.outlineStyle).toBe('solid');
	expect(Number.parseFloat(groupStyle.outlineWidth)).toBeGreaterThan(0);
});

test('opens from the trigger and restores focus after closing', async () => {
	await renderSearch();
	const trigger = page.getByRole('button', { name: /Search documentation/ });
	await openSearchDialog();
	await userEvent.click(page.getByRole('button', { name: 'Close search' }));
	await expect.element(trigger).toHaveFocus();
	const reopenedInput = await openSearchDialog();
	await expect.element(reopenedInput).toHaveFocus();
	await expect.element(reopenedInput).toHaveValue('');
});

test('opens with the keyboard shortcut outside editable controls', async () => {
	await renderSearch();
	page
		.getByRole('button', { name: /Search documentation/ })
		.element()
		.focus();
	await userEvent.keyboard('{Control>}k{/Control}');
	await expect.element(page.getByRole('searchbox', { name: 'Search documentation' })).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('button', { name: /Search documentation/ })).toHaveFocus();
	await userEvent.click(page.getByRole('textbox', { name: 'Editor' }));
	await userEvent.keyboard('{Control>}k{/Control}');
	await expect
		.element(page.getByRole('searchbox', { name: 'Search documentation' }))
		.not.toBeInTheDocument();
});

test('dismisses on backdrop press and restores focus', async () => {
	await renderSearch();
	const trigger = page.getByRole('button', { name: /Search documentation/ });
	await openSearchDialog();
	const dialog = page.getByRole('dialog', { name: 'Search documentation' });
	const overlay = dialog.element().parentElement?.parentElement?.parentElement;
	if (!(overlay instanceof HTMLElement)) throw new Error('Search backdrop was not rendered.');
	await userEvent.click(overlay);
	await expect
		.element(page.getByRole('searchbox', { name: 'Search documentation' }))
		.not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('shows safe highlighted results, breadcrumbs, and an empty state', async () => {
	await renderSearch();
	const input = await openSearchDialog();
	await typeSearchQuery(input, 'button');
	await expect.element(page.getByRole('status')).toHaveTextContent('4 results');

	const internal = page.getByRole('menuitem', { name: /Use the Button component/ });
	await expect.element(internal).toBeVisible();
	expect(internal.element().querySelector('mark')?.textContent).toBe('Button');
	// Breadcrumbs render above the title, separated by a chevron icon, not a "›" character.
	expect(internal.element().textContent).toContain('ComponentsActions');
	expect(internal.element().textContent).not.toContain('›');
	expect(internal.element().textContent).toContain('alert(1)');
	expect(internal.element().querySelector('script')).toBeNull();
	// No "Page"/"Text"/"Heading" type label is shown.
	expect(internal.element().textContent).not.toMatch(/^page$/i);

	const heading = page.getByRole('menuitem', { name: 'Props' });
	await expect.element(heading).toBeVisible();
	expect(heading.element().textContent).toContain('#');

	const code = page.getByRole('menuitem', { name: /Pass a field\.ref with a ref callback/ });
	await expect.element(code).toBeVisible();
	expect(code.element().querySelector('code')?.textContent).toBe('field.ref');
	expect(code.element().querySelector('mark')?.textContent).toBe('ref');

	const external = page.getByRole('menuitem', { name: /External Button reference/ });
	await expect.element(external).toHaveAttribute('href', 'https://example.com/button');
	await expect.element(external).toHaveAttribute('target', '_blank');
	await expect.element(external).toHaveAttribute('rel', 'noopener noreferrer');

	await userEvent.clear(input.element());
	await typeSearchQuery(input, 'missing');
	await expect.element(page.getByRole('status')).toHaveTextContent('No results found.');
	expect(page.getByRole('menuitem').elements()).toHaveLength(0);
});

test('shows loading and error states without stale results', async () => {
	await renderSearch();
	const input = await openSearchDialog();
	await typeSearchQuery(input, 'loading');
	await expect.element(page.getByRole('status')).toHaveTextContent('Searching…');
	expect(page.getByRole('menuitem').elements()).toHaveLength(0);

	await userEvent.clear(input.element());
	await typeSearchQuery(input, 'error');
	await expect.element(page.getByRole('status')).toHaveTextContent('Search is unavailable.');
	expect(page.getByRole('menuitem').elements()).toHaveLength(0);
});

function activeDescendantId(input: ReturnType<typeof page.getByRole>) {
	return input.element().getAttribute('aria-activedescendant');
}

test('navigates the selected result with ArrowDown and Enter, closing on activation', async () => {
	const router = await renderSearch();
	const trigger = page.getByRole('button', { name: /Search documentation/ });
	const input = await openSearchDialog();
	await typeSearchQuery(input, 'button');
	const first = page.getByRole('menuitem').nth(0).element();
	const second = page.getByRole('menuitem').nth(1).element();
	await expect.poll(() => activeDescendantId(input)).toBe(first.id);
	await userEvent.keyboard('{ArrowDown}');
	await expect.poll(() => activeDescendantId(input)).toBe(second.id);
	await userEvent.keyboard('{ArrowUp}');
	await expect.poll(() => activeDescendantId(input)).toBe(first.id);
	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByText('Button documentation')).toBeVisible();
	expect(router.state.location.pathname).toBe('/docs/button');
	expect(router.state.location.hash).toBe('usage');
	await expect
		.element(page.getByRole('searchbox', { name: 'Search documentation' }))
		.not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('clicking a result navigates and closes the dialog', async () => {
	const router = await renderSearch();
	const input = await openSearchDialog();
	await typeSearchQuery(input, 'button');
	await userEvent.click(page.getByRole('menuitem', { name: /Use the Button component/ }));
	await expect.element(page.getByText('Button documentation')).toBeVisible();
	expect(router.state.location.pathname).toBe('/docs/button');
	expect(router.state.location.hash).toBe('usage');
	await expect
		.element(page.getByRole('searchbox', { name: 'Search documentation' }))
		.not.toBeInTheDocument();
});

test('closes in one Escape press with text typed, and restores focus', async () => {
	await renderSearch();
	const trigger = page.getByRole('button', { name: /Search documentation/ });
	const input = await openSearchDialog();
	await typeSearchQuery(input, 'button');
	await userEvent.keyboard('{Escape}');
	await expect
		.element(page.getByRole('searchbox', { name: 'Search documentation' }))
		.not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('keeps the active result within the visible list while navigating and wraps at both ends', async () => {
	await renderSearch();
	const input = await openSearchDialog();
	await typeSearchQuery(input, 'many');
	const list = page.getByRole('menu', { name: 'Search results' }).element();
	expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);

	await userEvent.keyboard('{ArrowDown}'.repeat(10));
	const option = page.getByRole('menuitem').nth(10).element();
	const listBounds = list.getBoundingClientRect();
	const optionBounds = option.getBoundingClientRect();
	expect(activeDescendantId(input)).toBe(option.id);
	expect(optionBounds.top).toBeGreaterThanOrEqual(listBounds.top);
	expect(optionBounds.bottom).toBeLessThanOrEqual(listBounds.bottom);
	await expect.element(input).toHaveFocus();

	await userEvent.keyboard('{ArrowUp}');
	const previousElement = page.getByRole('menuitem').nth(9).element();
	expect(activeDescendantId(input)).toBe(previousElement.id);
	const previous = previousElement.getBoundingClientRect();
	expect(previous.top).toBeGreaterThanOrEqual(listBounds.top);
	expect(previous.bottom).toBeLessThanOrEqual(listBounds.bottom);
	await expect.element(input).toHaveFocus();

	// Wrap upward past the first item to the last.
	await userEvent.keyboard('{ArrowUp}'.repeat(10));
	const last = page
		.getByRole('menuitem')
		.nth(MANY_RESULTS_COUNT - 1)
		.element();
	expect(activeDescendantId(input)).toBe(last.id);
	const lastBounds = last.getBoundingClientRect();
	expect(lastBounds.top).toBeGreaterThanOrEqual(listBounds.top);
	expect(lastBounds.bottom).toBeLessThanOrEqual(listBounds.bottom);
	await expect.element(input).toHaveFocus();

	// Wrap downward past the last item back to the first.
	await userEvent.keyboard('{ArrowDown}');
	const first = page.getByRole('menuitem').nth(0).element();
	expect(activeDescendantId(input)).toBe(first.id);
	const firstBounds = first.getBoundingClientRect();
	expect(firstBounds.top).toBeGreaterThanOrEqual(listBounds.top);
	expect(firstBounds.bottom).toBeLessThanOrEqual(listBounds.bottom);
	await expect.element(input).toHaveFocus();
});
