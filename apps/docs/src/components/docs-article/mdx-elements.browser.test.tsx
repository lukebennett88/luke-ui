import '../../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
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
import {
	Card,
	Cards,
	createMdxHeading,
	MdxCode,
	MdxFence,
	MdxLink,
	MdxTable,
} from './mdx-elements.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.restoreAllMocks();
	await page.viewport(1024, 800);
});

const H2 = createMdxHeading(2);

test('opens an external link in a new tab without an opener', async () => {
	await renderMdx(<MdxLink href="https://example.com/docs">External</MdxLink>);

	const link = page.getByRole('link', { name: 'External' });
	await expect.element(link).toHaveAttribute('href', 'https://example.com/docs');
	await expect.element(link).toHaveAttribute('target', '_blank');
	await expect.element(link).toHaveAttribute('rel', 'noreferrer noopener');
});

test('keeps an internal link, with and without a hash, in the same tab', async () => {
	await renderMdx(
		<>
			<MdxLink href="/components/actions/button">Button</MdxLink>
			<MdxLink href="/docs/typography#fonts">Fonts</MdxLink>
			<MdxLink href="#local">Local</MdxLink>
		</>,
	);

	const expected = [
		['Button', '/components/actions/button'],
		['Fonts', '/docs/typography#fonts'],
		['Local', '#local'],
	] as const;
	await Promise.all(
		expected.map(async ([name, href]) => {
			const link = page.getByRole('link', { name });
			await expect.element(link).toHaveAttribute('href', href);
			expect(link.element().getAttribute('target')).toBeNull();
		}),
	);
});

test('links a heading to its own anchor and copies the full URL with the hash', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderMdx(<H2 id="usage">Usage</H2>);

	await expect.element(page.getByRole('link', { name: 'Usage' })).toHaveAttribute('href', '#usage');

	// The copied state arrives after the clipboard promise settles, so keep `act` open past it.
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy Anchor Link' }));
		await new Promise((resolve) => setTimeout(resolve, 50));
	});
	const copiedUrl = new URL(writeText.mock.calls[0]?.[0] ?? '');
	expect(copiedUrl.hash).toBe('#usage');
	expect(copiedUrl.pathname).toBe(window.location.pathname);

	const copied = page.getByRole('button', { name: 'Copied Anchor Link' });
	await expect.element(copied).toBeVisible();
	await expect.element(page.getByRole('status')).toHaveTextContent('Copied');
	await expect
		.element(page.getByRole('button', { name: 'Copy Anchor Link' }), { timeout: 3000 })
		.toBeVisible();
});

test('hides the anchor button until keyboard focus reaches the heading', async () => {
	await renderMdx(<H2 id="usage">Usage</H2>);

	const button = page.getByRole('button', { name: 'Copy Anchor Link' });
	expect(getComputedStyle(button.element()).opacity).toBe('0');

	await userEvent.tab();
	await userEvent.tab();
	await expect.element(button).toHaveFocus();
	await expect.poll(() => getComputedStyle(button.element()).opacity).toBe('1');
});

test('keeps the anchor button a 24px target', async () => {
	await renderMdx(<H2 id="usage">Usage</H2>);

	const { height, width } = page
		.getByRole('button', { name: 'Copy Anchor Link' })
		.element()
		.getBoundingClientRect();
	expect([width, height]).toEqual([24, 24]);
});

test('renders a heading without an id as plain text', async () => {
	await renderMdx(<H2>Plain</H2>);

	await expect.element(page.getByRole('heading', { name: 'Plain', level: 2 })).toBeVisible();
	expect(page.getByRole('link')).not.toBeInTheDocument();
	expect(page.getByRole('button')).not.toBeInTheDocument();
});

test('names a wide table as a focusable region once it overflows', async () => {
	await page.viewport(400, 800);
	await renderMdx(
		<div style={{ inlineSize: '12rem' }}>
			<MdxTable>
				<tbody>
					<tr>
						<td style={{ minInlineSize: '30rem' }}>Wide cell</td>
					</tr>
				</tbody>
			</MdxTable>
		</div>,
	);

	const region = page.getByRole('region', { name: 'Scrollable table' });
	await expect.element(region).toBeVisible();
	expect(region.element().tabIndex).toBe(0);
});

test('leaves fenced code as plain code and styles inline code', async () => {
	await renderMdx(
		<>
			<p>
				<MdxCode>inline</MdxCode>
			</p>
			<MdxFence>
				<MdxCode>fenced</MdxCode>
			</MdxFence>
		</>,
	);

	const inline = page.getByText('inline').element();
	const fenced = page.getByText('fenced').element();
	expect(getComputedStyle(inline).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	expect(getComputedStyle(fenced).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('renders a card as a link with a heading and its description', async () => {
	await renderMdx(
		<Cards>
			<Card href="/components/layout/stack" title="Stack">
				<p>Stack children on the block axis.</p>
			</Card>
		</Cards>,
	);

	const link = page.getByRole('link', { name: /Stack/ });
	await expect.element(link).toHaveAttribute('href', '/components/layout/stack');
	await expect.element(link.getByRole('heading', { name: 'Stack', level: 3 })).toBeVisible();
	await expect.element(link.getByText('Stack children on the block axis.')).toBeVisible();
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
