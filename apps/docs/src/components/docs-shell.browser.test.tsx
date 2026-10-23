import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import type { Root as PageTree } from 'fumadocs-core/page-tree';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { SIDEBAR_STORAGE_KEY } from '../lib/sidebar-prefs-shared.js';
import { DocsShell } from './docs-shell.js';
import { DocsSearchProvider } from './search.js';
import { DocsThemeRoot } from './theme-controls.js';

const tree: PageTree = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: <span>Documentation</span>,
			root: true,
			children: [
				{ type: 'separator', name: 'Overview' },
				{ type: 'page', name: 'Installation', url: '/docs/installation' },
				{ type: 'separator', name: 'Foundations' },
				{ type: 'page', name: 'Composition', url: '/docs/composition' },
			],
		},
	],
	fallback: {
		name: 'Components',
		children: [
			{
				type: 'folder',
				name: 'Components',
				root: true,
				index: { type: 'page', name: 'All components', url: '/components' },
				children: [
					{ type: 'separator', name: 'Actions' },
					{ type: 'page', name: 'Button', url: '/components/actions/button' },
					{ type: 'page', name: 'Text', url: '/components/typography/text' },
				],
			},
		],
	},
};

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.dir = '';
	delete document.documentElement.dataset.docsSidebar;
	container = undefined;
	root = undefined;
	await page.viewport(1024, 800);
});

// Docs size queries are `@container` queries against `:root`. Without that containment they never
// match, and every layout silently falls back to its base style.
test('contains the root so docs container queries have a container to match', () => {
	expect(getComputedStyle(document.documentElement).containerType).toBe('inline-size');
});

test('keeps every section visible in RTL with plain link semantics', async () => {
	await page.viewport(1280, 800);
	document.documentElement.dir = 'rtl';
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	const navigation = page.getByRole('navigation', { name: 'Docs' });
	await expect.element(navigation.getByText('Foundations')).toBeVisible();
	await expect.element(navigation.getByText('Actions')).not.toBeInTheDocument();
	await expect
		.element(navigation.getByRole('link', { name: 'Installation' }))
		.toHaveAttribute('aria-current', 'page');
	await expect
		.element(navigation.getByRole('link', { name: 'Composition' }))
		.not.toHaveAttribute('aria-current');
});

test('groups separator sections into nested lists and moves keyboard focus through the desktop nav with Tab', async () => {
	await page.viewport(1280, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	const navigation = page.getByRole('navigation', { name: 'Docs' });
	const installation = navigation.getByRole('link', { name: 'Installation' });
	const overview = navigation.getByRole('heading', { name: 'Overview', level: 2 });
	const foundations = navigation.getByRole('heading', { name: 'Foundations', level: 2 });
	await expect.element(overview).toBeVisible();
	await expect.element(foundations).toBeVisible();
	await expect.element(navigation.getByText('Documentation')).not.toBeInTheDocument();
	await expect.element(navigation.getByText('Actions')).not.toBeInTheDocument();
	await expect.element(navigation.getByRole('link', { name: 'Button' })).not.toBeInTheDocument();
	await expect.element(navigation.getByRole('button')).not.toBeInTheDocument();

	const overviewList = navigation
		.element()
		.querySelector(`ul[aria-labelledby="${overview.element().id}"]`);
	expect(overviewList).not.toBeNull();
	expect(
		Array.from(overviewList!.querySelectorAll(':scope > li > a'), (link) => link.textContent),
	).toEqual(['Installation']);
	const foundationsList = navigation
		.element()
		.querySelector(`ul[aria-labelledby="${foundations.element().id}"]`);
	expect(foundationsList).not.toBeNull();
	expect(
		Array.from(foundationsList!.querySelectorAll(':scope > li > a'), (link) => link.textContent),
	).toEqual(['Composition']);

	// Nested section lists must not pick up UA markers or indent without Preflight.
	for (const list of navigation.element().querySelectorAll('ul')) {
		const listStyle = getComputedStyle(list);
		expect(listStyle.listStyleType).toBe('none');
		expect(listStyle.marginTop).toBe('0px');
		expect(listStyle.marginBottom).toBe('0px');
		expect(listStyle.paddingInlineStart).toBe('0px');
	}

	expect(
		Array.from(navigation.element().querySelectorAll('a'), (link) => link.textContent),
	).toEqual(['Installation', 'Composition']);
	await expect.element(installation).toHaveAttribute('aria-current', 'page');
	await act(async () => {
		installation.element().focus();
	});
	await act(async () => {
		await userEvent.tab();
	});
	await expect.element(navigation.getByRole('link', { name: 'Composition' })).toHaveFocus();
});

test('shows the Documentation section at the docs root', async () => {
	await page.viewport(1280, 800);
	await renderAt(
		'/docs',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	const navigation = page.getByRole('navigation', { name: 'Docs' });
	await expect.element(navigation.getByRole('link', { name: 'Installation' })).toBeVisible();
	await expect
		.element(navigation.getByRole('link', { name: 'All components' }))
		.not.toBeInTheDocument();
});

for (const pathname of ['/components', '/components/actions/button']) {
	test(`renders only the Components section at ${pathname}`, async () => {
		await page.viewport(1280, 800);
		await renderAt(
			pathname,
			<DocsShell tree={tree}>
				<main>Article</main>
			</DocsShell>,
		);

		const navigation = page.getByRole('navigation', { name: 'Docs' });
		const actions = navigation.getByRole('heading', { name: 'Actions', level: 2 });
		await expect.element(actions).toBeVisible();
		await expect
			.element(navigation.getByRole('link', { name: 'Installation' }))
			.not.toBeInTheDocument();
		const actionsList = navigation
			.element()
			.querySelector(`ul[aria-labelledby="${actions.element().id}"]`);
		expect(actionsList).not.toBeNull();
		expect(
			Array.from(actionsList!.querySelectorAll(':scope > li > a'), (link) => link.textContent),
		).toEqual(['Button', 'Text']);
		expect(
			Array.from(navigation.element().querySelectorAll('a'), (link) => link.textContent),
		).toEqual(['All components', 'Button', 'Text']);
		await expect
			.element(
				navigation.getByRole('link', {
					name: pathname === '/components' ? 'All components' : 'Button',
				}),
			)
			.toHaveAttribute('aria-current', 'page');
		expect(
			navigation
				.getByRole('link', { name: 'All components' })
				.element()
				.getAttribute('aria-current'),
		).toBe(pathname === '/components' ? 'page' : null);
	});
}

test('opens the mobile drawer, exposes site and docs navigation, and restores focus on Escape', async () => {
	await page.viewport(390, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	const trigger = page.getByRole('button', { name: 'Menu' });
	await act(async () => {
		await userEvent.click(trigger);
	});
	await expect.element(page.getByRole('dialog', { name: 'Docs navigation' })).toBeVisible();
	await expect
		.element(
			page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Playground' }),
		)
		.toBeVisible();
	await expect
		.element(page.getByRole('dialog').getByRole('link', { name: 'Installation' }))
		.toBeVisible();
	await expect
		.element(page.getByRole('dialog').getByRole('link', { name: 'Button' }))
		.not.toBeInTheDocument();
	await act(async () => {
		await userEvent.keyboard('{Escape}');
	});
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('closes the mobile drawer from its close button and restores focus', async () => {
	await page.viewport(390, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	const trigger = page.getByRole('button', { name: 'Menu' });
	await act(async () => {
		await userEvent.click(trigger);
	});
	await expect.element(page.getByRole('dialog', { name: 'Docs navigation' })).toBeVisible();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Close docs navigation' }));
	});
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('closes the mobile drawer when a docs nav link is activated', async () => {
	await page.viewport(390, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	const dialog = page.getByRole('dialog', { name: 'Docs navigation' });
	await expect.element(dialog).toBeVisible();
	await act(async () => {
		await userEvent.click(dialog.getByRole('link', { name: 'Composition' }));
	});
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('shows the Components section in the mobile drawer', async () => {
	await page.viewport(390, 800);
	await renderAt(
		'/components/actions/button',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	const dialog = page.getByRole('dialog', { name: 'Docs navigation' });
	await expect.element(dialog.getByRole('link', { name: 'All components' })).toBeVisible();
	await expect
		.element(dialog.getByRole('link', { name: 'Button' }))
		.toHaveAttribute('aria-current', 'page');
	await expect.element(dialog.getByRole('link', { name: 'Installation' })).not.toBeInTheDocument();
});

test('closes the mobile drawer when the viewport crosses into the desktop layout', async () => {
	await page.viewport(390, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	await expect.element(page.getByRole('dialog', { name: 'Docs navigation' })).toBeVisible();

	await act(async () => {
		await page.viewport(1280, 800);
	});

	await expect
		.element(page.getByRole('dialog', { name: 'Docs navigation' }))
		.not.toBeInTheDocument();
	const navigation = page.getByRole('navigation', { name: 'Docs' });
	await expect.element(navigation.getByRole('link', { name: 'Installation' })).toBeVisible();
	await expect
		.element(navigation.getByRole('link', { name: 'Installation' }))
		.toHaveAttribute('aria-current', 'page');
	await act(async () => {
		navigation.getByRole('link', { name: 'Installation' }).element().focus();
	});
	await act(async () => {
		await userEvent.tab();
	});
	await expect.element(navigation.getByRole('link', { name: 'Composition' })).toHaveFocus();
});

test('keeps search and theme in the header while the sidebar shows', async () => {
	await page.viewport(1280, 800);
	await renderShell('/docs/installation');

	const sidebar = getSidebar();
	const header = page.getByRole('banner');
	await expect.element(sidebar).toBeVisible();
	const search = header.getByRole('button', { name: 'Open Search' });
	await expect.element(search).toBeVisible();
	expect(sidebar.contains(search.element())).toBe(false);
	await expect.element(header.getByRole('button', { name: 'Theme' })).toBeVisible();
	await expect
		.element(page.getByRole('radiogroup', { name: 'Theme profile' }))
		.not.toBeInTheDocument();
	await expect
		.element(header.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Docs' }))
		.toHaveAttribute('aria-current', 'page');
	await act(async () => {
		search.element().focus();
		await userEvent.keyboard('{Enter}');
	});
	await expect.element(page.getByRole('dialog', { name: 'Search documentation' })).toBeVisible();
	await act(async () => {
		await userEvent.keyboard('{Escape}');
	});
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(search).toHaveFocus();
});

test('hides the sidebar from its toggle, keeps header search, and remembers the choice', async () => {
	await page.viewport(1280, 800);
	await renderShell('/docs/installation');

	const hide = page.getByRole('button', { name: 'Hide sidebar' });
	await expect.element(hide).toHaveAttribute('aria-expanded', 'true');
	await expect.element(hide).toHaveAttribute('aria-controls', getSidebar().id);

	await act(async () => {
		await userEvent.click(hide);
	});

	const show = page.getByRole('button', { name: 'Show sidebar' });
	await expect.element(show).toHaveAttribute('aria-expanded', 'false');
	await expect.element(show).toHaveFocus();
	await expect.element(getSidebar()).not.toBeVisible();
	expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('collapsed');
	expect(document.documentElement).toHaveAttribute('data-docs-sidebar', 'collapsed');
	const header = page.getByRole('banner');
	await expect.element(header.getByRole('button', { name: 'Open Search' })).toBeVisible();
	await expect.element(header.getByRole('button', { name: 'Theme' })).toBeVisible();

	await act(async () => {
		await userEvent.click(show);
	});

	await expect.element(page.getByRole('button', { name: 'Hide sidebar' })).toBeVisible();
	await expect.element(getSidebar()).toBeVisible();
	expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('expanded');
	expect(document.documentElement).not.toHaveAttribute('data-docs-sidebar');
});

for (const direction of ['ltr', 'rtl']) {
	test(`moves the sidebar toggle beside the wordmark when collapsed in ${direction}`, async () => {
		await page.viewport(1280, 800);
		document.documentElement.dir = direction;
		await renderShell('/docs/installation');

		const sidebar = getSidebar();
		const width = sidebar.getBoundingClientRect().width;
		const toggleControl = page.getByRole('button', { name: 'Hide sidebar' }).element();
		const search = page.getByRole('button', { name: 'Open Search' }).element();
		await act(async () => {
			await userEvent.click(page.getByRole('button', { name: 'Hide sidebar' }));
		});

		expect(sidebar.inert).toBe(true);
		const motion = [
			...sidebar.getAnimations(),
			...toggleControl.getAnimations(),
			...(search.parentElement?.getAnimations() ?? []),
		];
		expect(motion.length).toBeGreaterThan(0);
		for (const animation of motion) {
			animation.pause();
			animation.currentTime = Number(animation.effect?.getTiming().duration) / 2;
		}
		expect(Number(getComputedStyle(sidebar).opacity)).toBeGreaterThan(0);
		expect(Number(getComputedStyle(sidebar).opacity)).toBeLessThan(1);
		expect(sidebar.getBoundingClientRect().width).toBe(width);
		await expect.element(search).toBeVisible();
		const toggleRect = toggleControl.getBoundingClientRect();
		const searchRect = search.getBoundingClientRect();
		expect(
			direction === 'rtl' ? toggleRect.left - searchRect.right : searchRect.left - toggleRect.right,
		).toBeCloseTo(16, 0);
		for (const animation of motion) animation.play();
		await expect.element(sidebar).not.toBeVisible();
		const toggle = page.getByRole('button', { name: 'Show sidebar' }).element();
		const wordmark = page.getByRole('banner').getByRole('link', { name: 'Luke UI' }).element();
		await expect
			.poll(() => {
				const logo = wordmark.getBoundingClientRect();
				const button = toggle.getBoundingClientRect();
				return direction === 'rtl' ? logo.left - button.right : button.left - logo.right;
			})
			.toBeCloseTo(4, 0);
		await expect.element(toggle).toHaveFocus();
	});
}

test('renders collapsed when the head script already collapsed the sidebar', async () => {
	await page.viewport(1280, 800);
	document.documentElement.dataset.docsSidebar = 'collapsed';
	await renderShell('/docs/installation');

	await expect
		.element(page.getByRole('button', { name: 'Show sidebar' }))
		.toHaveAttribute('aria-expanded', 'false');
	await expect.element(getSidebar()).not.toBeVisible();
});

test('offers no sidebar toggle below the sidebar layout, and keeps theme controls in the drawer', async () => {
	await page.viewport(390, 800);
	await renderShell('/docs/installation');

	await expect.element(page.getByRole('button', { name: /sidebar/ })).not.toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Theme' })).not.toBeInTheDocument();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	const dialog = page.getByRole('dialog', { name: 'Docs navigation' });
	await expect.element(dialog.getByRole('radiogroup', { name: 'Theme profile' })).toBeVisible();
	await expect.element(dialog.getByRole('radiogroup', { name: 'Colour mode' })).toBeVisible();
});

test('aligns the drawer title with the site wordmark', async () => {
	await page.viewport(390, 800);
	await renderShell('/docs/installation');

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	const wordmark = page.getByRole('banner').getByRole('link', { name: 'Luke UI' }).element();
	const title = page
		.getByRole('dialog', { name: 'Docs navigation' })
		.getByText('Navigation')
		.element();
	const wordmarkBox = wordmark.getBoundingClientRect();
	const titleBox = title.getBoundingClientRect();

	expect(getComputedStyle(title).fontSize).toBe(getComputedStyle(wordmark).fontSize);
	expect(titleBox.top + titleBox.height / 2).toBeCloseTo(
		wordmarkBox.top + wordmarkBox.height / 2,
		0,
	);
});

test('pins the theme controls to the bottom of the mobile drawer', async () => {
	await page.viewport(390, 500);
	const tallTree: PageTree = {
		name: 'Docs',
		children: [
			{
				type: 'folder',
				name: <span>Documentation</span>,
				root: true,
				children: [
					{ type: 'separator', name: 'Overview' },
					...Array.from({ length: 40 }, (_, index) => ({
						type: 'page' as const,
						name: `Guide ${index}`,
						url: `/docs/guide-${index}`,
					})),
				],
			},
		],
	};
	await renderAt(
		'/docs/guide-0',
		<DocsShell tree={tallTree}>
			<main>Article</main>
		</DocsShell>,
	);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	const dialog = page.getByRole('dialog', { name: 'Docs navigation' }).element();
	const themeProfile = page.getByRole('radiogroup', { name: 'Theme profile' }).element();
	const footer = themeProfile.parentElement?.parentElement;
	assert(footer instanceof HTMLElement, 'expected the drawer footer');
	const scrollBody = footer.previousElementSibling;
	assert(scrollBody instanceof HTMLElement, 'expected the scrollable drawer body');

	const dialogBox = dialog.getBoundingClientRect();
	const themeBefore = themeProfile.getBoundingClientRect();
	expect(themeBefore.bottom).toBeLessThanOrEqual(dialogBox.bottom);
	expect(themeBefore.top).toBeGreaterThan(dialogBox.top + dialogBox.height / 2);
	expect(scrollBody.scrollHeight).toBeGreaterThan(scrollBody.clientHeight);

	scrollBody.scrollTop = scrollBody.scrollHeight;
	expect(themeProfile.getBoundingClientRect().top).toBeCloseTo(themeBefore.top, 0);
});

function getSidebar() {
	const sidebar = document.getElementById('docs-sidebar');
	if (!sidebar) throw new Error('Expected the docs sidebar.');
	return sidebar;
}

async function renderShell(pathname: string) {
	await renderAt(
		pathname,
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);
}

async function renderAt(pathname: string, children: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<RootProvider search={{ enabled: false }} theme={{ enabled: false }}>
				<Provider spritesheetHref={spriteSheetHref}>
					<DocsSearchProvider>
						<DocsThemeRoot>{children}</DocsThemeRoot>
					</DocsSearchProvider>
				</Provider>
			</RootProvider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: [pathname] }),
		routeTree: rootRoute,
	});
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
