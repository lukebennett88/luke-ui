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
const H3 = createMdxHeading(3);

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

const linkPaths = [
	['an external link', 'https://example.com/docs', '_blank'],
	['a hash-only link', '#local', null],
	['an internal link', '/docs/typography#fonts', null],
] as const;

for (const [kind, href, target] of linkPaths) {
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
		expect(link.element().classList.length).toBeGreaterThan(1);
		// React Aria Components still owns `target` and `rel`, so an external link keeps its defaults.
		expect(link.element().getAttribute('target')).toBe(target);
		expect(link.element().getAttribute('rel')).toBe(target && 'noreferrer noopener');
	});
}

test('merges an author rel into the external link safety tokens', async () => {
	await renderMdx(
		<MdxLink href="https://example.com" rel="nofollow noopener">
			Merged
		</MdxLink>,
	);

	const rel = page.getByRole('link', { name: 'Merged' }).element().getAttribute('rel');
	expect(rel?.split(' ').sort()).toEqual(['nofollow', 'noopener', 'noreferrer']);
});

test('lets an author target and rel override the external link defaults', async () => {
	await renderMdx(
		<MdxLink href="https://example.com" rel="author" target="_self">
			Same tab
		</MdxLink>,
	);

	const link = page.getByRole('link', { name: 'Same tab' });
	await expect.element(link).toHaveAttribute('target', '_self');
	await expect.element(link).toHaveAttribute('rel', 'author');
});

test('renders a link without an href as a placeholder anchor that keeps its attributes', async () => {
	await renderMdx(
		<MdxLink data-testid="placeholder" id="target" title="Marker">
			Marker text
		</MdxLink>,
	);

	const anchor = page.getByTestId('placeholder');
	await expect.element(anchor).toHaveAttribute('id', 'target');
	await expect.element(anchor).toHaveAttribute('title', 'Marker');
	expect(anchor.element().hasAttribute('href')).toBe(false);
	expect(page.getByRole('link')).not.toBeInTheDocument();
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

		await act(async () => {
			await userEvent.keyboard('{Enter}');
			await new Promise((resolve) => setTimeout(resolve, 50));
		});
		await expect.element(page.getByRole('status')).toHaveTextContent('Copied');
		await expect
			.element(page.getByRole('heading', { exact: true, level, name: 'Usage' }))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Copied Anchor Link' })).toBeVisible();
	});
}

test('keeps the heading id as the deep-link target and gives the anchor a distinct id', async () => {
	await renderMdx(
		<>
			<H2 id="usage">Usage</H2>
			<H2 id="usage-title">Usage title</H2>
		</>,
	);

	const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
	expect(new Set(ids).size).toBe(ids.length);
	const heading = page.getByRole('heading', { name: 'Usage', exact: true }).element();
	expect(heading.id).toBe('usage');
	expect(heading.querySelector('a')?.getAttribute('href')).toBe('#usage');
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

test('renders a card as a link with a title and its description', async () => {
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

test('names an external card as opening in a new tab', async () => {
	await renderMdx(
		<Cards>
			<Card href="https://example.com/guide" title="External guide">
				Read the external guide.
			</Card>
		</Cards>,
	);

	const link = page.getByRole('link', { name: /External guide.*opens in a new tab/i });
	await expect.element(link).toHaveAttribute('href', 'https://example.com/guide');
	await expect.element(link).toHaveAttribute('target', '_blank');
	await expect.element(link).toHaveAttribute('rel', 'noreferrer noopener');
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
