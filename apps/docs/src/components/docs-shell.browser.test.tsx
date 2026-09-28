import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
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
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
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
	container = undefined;
	root = undefined;
	await page.viewport(1024, 800);
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

test('renders flat sections in page order and moves keyboard focus through the desktop nav with Tab', async () => {
	await page.viewport(1280, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);

	const navigation = page.getByRole('navigation', { name: 'Docs' });
	const installation = navigation.getByRole('link', { name: 'Installation' });
	await expect.element(navigation.getByText('Overview')).toBeVisible();
	await expect.element(navigation.getByText('Documentation')).not.toBeInTheDocument();
	await expect.element(navigation.getByText('Foundations')).toBeVisible();
	await expect.element(navigation.getByText('Actions')).not.toBeInTheDocument();
	await expect.element(navigation.getByRole('link', { name: 'Button' })).not.toBeInTheDocument();
	await expect.element(navigation.getByRole('button')).not.toBeInTheDocument();
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
		await expect.element(navigation.getByText('Actions')).toBeVisible();
		await expect
			.element(navigation.getByRole('link', { name: 'Installation' }))
			.not.toBeInTheDocument();
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

	const trigger = page.getByRole('button', { name: 'Open docs navigation' });
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

	const trigger = page.getByRole('button', { name: 'Open docs navigation' });
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
		await userEvent.click(page.getByRole('button', { name: 'Open docs navigation' }));
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
		await userEvent.click(page.getByRole('button', { name: 'Open docs navigation' }));
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
		await userEvent.click(page.getByRole('button', { name: 'Open docs navigation' }));
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

async function renderAt(pathname: string, children: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<RootProvider search={{ enabled: false }} theme={{ enabled: false }}>
				<DocsSearchProvider>
					<IconSpritesheetProvider href={spriteSheetHref}>
						<DocsThemeRoot>{children}</DocsThemeRoot>
					</IconSpritesheetProvider>
				</DocsSearchProvider>
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
