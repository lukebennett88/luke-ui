import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../lib/story-wrapper';
import { PageActions } from './page-actions';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const githubUrl = 'https://github.com/example/repo/edit/main/page.mdx';
const markdownUrl = '/example-page.md';
const reactAriaUrl = 'https://react-spectrum.adobe.com/react-aria/Button.html';
const sourceUrl = 'https://github.com/example/repo/tree/main/packages/example/src/button';
const storybookUrl = 'https://storybook.example/?path=/docs/example--docs';

test('renders every destination inline, labelled and reachable, when all are present', async () => {
	renderActions({ githubUrl, markdownUrl, reactAriaUrl, sourceUrl, storybookUrl });

	await expect
		.element(page.getByRole('link', { name: 'Storybook' }))
		.toHaveAttribute('href', storybookUrl);
	await expect
		.element(page.getByRole('link', { name: 'React Aria' }))
		.toHaveAttribute('href', reactAriaUrl);
	await expect
		.element(page.getByRole('link', { name: 'Source' }))
		.toHaveAttribute('href', sourceUrl);
	await expect.element(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
	await expect
		.element(page.getByRole('link', { name: 'View as Markdown' }))
		.toHaveAttribute('href', markdownUrl);
	await expect
		.element(page.getByRole('link', { name: 'Edit on GitHub' }))
		.toHaveAttribute('href', githubUrl);
});

test('omits the Storybook, React Aria, and Source pills when the page has none', async () => {
	renderActions({
		githubUrl,
		markdownUrl,
		reactAriaUrl: null,
		sourceUrl: null,
		storybookUrl: null,
	});

	expect(page.getByRole('link', { name: 'Storybook' })).not.toBeInTheDocument();
	expect(page.getByRole('link', { name: 'React Aria' })).not.toBeInTheDocument();
	expect(page.getByRole('link', { name: 'Source' })).not.toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
	await expect.element(page.getByRole('link', { name: 'View as Markdown' })).toBeVisible();
	await expect.element(page.getByRole('link', { name: 'Edit on GitHub' })).toBeVisible();
});

test('reports the copied state after Copy Markdown succeeds', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response('# Example', { status: 200 })),
	);
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

	renderActions({
		githubUrl,
		markdownUrl,
		reactAriaUrl: null,
		sourceUrl: null,
		storybookUrl: null,
	});

	await userEvent.click(page.getByRole('button', { name: 'Copy Markdown' }));

	await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
	expect(writeText).toHaveBeenCalledWith('# Example');
});

test('does not claim success when the markdown fetch 404s', async () => {
	// `fetch` resolves normally on an HTTP error response, it does not
	// reject — this stub reproduces a stale route or a missing generated
	// `.md` file so the "Copied" state must not fire on a non-ok response.
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response('Not found', { status: 404 })),
	);

	// `useCopyButton` has no `onRejected` handler, so the rejection this
	// throw produces surfaces as an unhandled rejection rather than being
	// caught anywhere — that is the exact behaviour under test, not a bug in
	// the test. Mark it handled so it doesn't fail the run.
	const onUnhandledRejection = (event: PromiseRejectionEvent) => {
		event.preventDefault();
	};
	window.addEventListener('unhandledrejection', onUnhandledRejection);

	try {
		renderActions({
			githubUrl,
			markdownUrl,
			reactAriaUrl: null,
			sourceUrl: null,
			storybookUrl: null,
		});
		await userEvent.click(page.getByRole('button', { name: 'Copy Markdown' }));

		// Give the rejected promise a tick to settle, then confirm the label
		// never flips.
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(page.getByRole('button', { name: 'Copied' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
	} finally {
		window.removeEventListener('unhandledrejection', onUnhandledRejection);
	}
});

test('does not announce the brand marks as separate content', () => {
	renderActions({ githubUrl, markdownUrl, reactAriaUrl, sourceUrl, storybookUrl });

	// These SVGs have no accessible name, so a named `img` query would still
	// pass if `aria-hidden` were removed. The owned contract is the attribute.
	for (const name of ['Storybook', 'React Aria', 'Source', 'Edit on GitHub']) {
		const mark = page.getByRole('link', { name }).element().querySelector('svg');
		if (mark == null) throw new Error(`Expected a brand mark inside the ${name} link.`);
		expect(mark.getAttribute('aria-hidden')).toBe('true');
	}
});

function renderActions(props: {
	githubUrl: string;
	markdownUrl: string;
	reactAriaUrl: string | null;
	sourceUrl: string | null;
	storybookUrl: string | null;
}) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(wrap(<PageActions {...props} />));
	});
}

function wrap(children: ReactNode) {
	return <StoryWrapper>{children}</StoryWrapper>;
}
