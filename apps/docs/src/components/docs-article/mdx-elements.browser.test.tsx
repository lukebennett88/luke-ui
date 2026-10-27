import '../../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Prose } from '@luke-ui/react/prose';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { DocsThemeRoot } from '../theme-controls.js';
import { createMdxHeading, MdxLink, MdxTable } from './mdx-elements.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.restoreAllMocks();
	vi.useRealTimers();
	await page.viewport(1024, 800);
});

const H2 = createMdxHeading(2);
const H3 = createMdxHeading(3);

test('opens an external link in a new tab without an opener', async () => {
	await renderMdx(<MdxLink href="https://example.com/docs">External</MdxLink>);

	const link = page.getByRole('link', { name: 'External' });
	await expect.element(link).toHaveAttribute('href', 'https://example.com/docs');
	await expect.element(link).toHaveAttribute('target', '_blank');
	await expect.element(link).toHaveAttribute('rel', 'noreferrer noopener');
});

const linkPaths = [
	['an external link', 'https://example.com/docs'],
	['a hash-only link', '#local'],
	['an internal link', '/docs/typography#fonts'],
] as const;

for (const [kind, href] of linkPaths) {
	test(`keeps the anchor attributes an author writes on ${kind}`, async () => {
		await renderMdx(
			<MdxLink
				aria-controls="panel"
				aria-expanded="false"
				aria-haspopup="menu"
				aria-label="Read more"
				className="author-class"
				data-foo="bar"
				data-testid="the-link"
				download="file.txt"
				hrefLang="fr"
				href={href}
				id="author-id"
				title="Link title"
				type="text/html"
			>
				Visible text
			</MdxLink>,
		);

		const link = page.getByTestId('the-link');
		await expect.element(link).toHaveAttribute('href', href);
		await expect.element(link).toHaveAttribute('title', 'Link title');
		await expect.element(link).toHaveAttribute('id', 'author-id');
		await expect.element(link).toHaveAttribute('aria-label', 'Read more');
		await expect.element(link).toHaveAttribute('download', 'file.txt');
		await expect.element(link).toHaveAttribute('data-foo', 'bar');
		await expect.element(link).toHaveAttribute('hreflang', 'fr');
		await expect.element(link).toHaveAttribute('type', 'text/html');
		await expect.element(link).toHaveAttribute('aria-expanded', 'false');
		await expect.element(link).toHaveAttribute('aria-controls', 'panel');
		await expect.element(link).toHaveAttribute('aria-haspopup', 'menu');
		// React Aria Components still owns the class list, so the Link recipe class sits beside the author's.
		expect(link.element().classList.contains('author-class')).toBe(true);
	});
}

test('links a heading to its own anchor and copies the full URL with the hash', async () => {
	// Fake only the revert timer: a real 1.5s timeout can fire before `expect.element` starts
	// polling on a slow runner, so "Copied" is never observed.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderMdx(<H2 id="usage">Usage</H2>);

	await expect.element(page.getByRole('link', { name: 'Usage' })).toHaveAttribute('href', '#usage');

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy Anchor Link' }));
	});
	const copiedUrl = new URL(writeText.mock.calls[0]?.[0] ?? '');
	expect(copiedUrl.hash).toBe('#usage');
	expect(copiedUrl.pathname).toBe(window.location.pathname);

	await expect.element(page.getByRole('button', { name: 'Copied Anchor Link' })).toBeVisible();
	await expect.element(page.getByRole('status')).toHaveTextContent('Copied');

	await act(async () => {
		vi.advanceTimersByTime(1500);
	});
	await expect.element(page.getByRole('button', { name: 'Copy Anchor Link' })).toBeVisible();
});

for (const [level, Heading] of [
	[2, H2],
	[3, H3],
] as const) {
	test(`names an h${level} by its text alone while the copy button stays inside it`, async () => {
		vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
		await renderMdx(<Heading id="usage">Usage</Heading>);

		const heading = page.getByRole('heading', { exact: true, level, name: 'Usage' });
		await expect.element(heading).toBeVisible();
		const button = page.getByRole('button', { name: 'Copy Anchor Link' });
		expect(heading.element().contains(button.element())).toBe(true);

		await userEvent.tab();
		await userEvent.tab();
		await expect.element(button).toHaveFocus();

		// Fake only the revert timer after focus: a real 1.5s timeout can fire before
		// `expect.element` starts polling on a slow runner, so "Copied" is never observed.
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		await act(async () => {
			await userEvent.keyboard('{Enter}');
		});
		await expect.element(page.getByRole('status')).toHaveTextContent('Copied');
		await expect
			.element(page.getByRole('heading', { exact: true, level, name: 'Usage' }))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Copied Anchor Link' })).toBeVisible();
	});
}

test('names a wide table as a focusable region once it overflows', async () => {
	await page.viewport(400, 800);
	await renderMdx(
		<Prose style={{ inlineSize: '12rem' }}>
			<MdxTable>
				<tbody>
					<tr>
						<td style={{ minInlineSize: '30rem' }}>Wide cell</td>
					</tr>
				</tbody>
			</MdxTable>
		</Prose>,
	);

	const region = page.getByRole('region', { name: 'Scrollable table' });
	await expect.element(region).toBeVisible();
	expect(region.element().tabIndex).toBe(0);
	// Prose makes a plain table scroll itself. The docs table leaves that to its ScrollFade.
	const scroller = region.element();
	const table = scroller.querySelector('table')!;
	expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
	expect(table.scrollWidth).toBe(table.clientWidth);
});

async function renderMdx(children: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</Provider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/docs/example'] }),
		routeTree: rootRoute,
	});
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
