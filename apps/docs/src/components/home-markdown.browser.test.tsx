import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { HeadingLevels } from '@luke-ui/react/heading';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { homeMarkdown } from '../lib/home-content.js';
import { HomeFeatures } from './home-features.js';
import { HomeHero } from './home-hero.js';
import { DocsThemeRoot } from './theme-controls.js';

const WHITESPACE_PATTERN = /\s+/g;

// The `/index.md` twin is hand-written, so these tests render the homepage
// sections and require every heading, paragraph, link, and code line to appear
// in it. The interactive demo form is not part of the Markdown.

let container: HTMLElement | undefined;
let root: Root | undefined;

beforeEach(async () => {
	await renderHomepage();
});

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	container = undefined;
	root = undefined;
});

test('the Markdown has every homepage heading at the same level', () => {
	const markdownLines = homeMarkdown().split('\n');
	const headings = getRenderedHome().querySelectorAll('h1, h2, h3, h4, h5, h6');

	expect(headings.length).toBe(8);
	for (const heading of headings) {
		const level = Number(heading.tagName.slice(1));
		expect(markdownLines).toContain(`${'#'.repeat(level)} ${normalise(heading.textContent)}`);
	}
});

test('the Markdown has every homepage paragraph', () => {
	const markdown = normalise(homeMarkdown().replaceAll('`', ''));
	const paragraphs = [...getRenderedHome().querySelectorAll('p')].filter(
		(paragraph) => !paragraph.closest('form'),
	);

	expect(paragraphs.length).toBe(7);
	for (const paragraph of paragraphs) {
		expect(markdown).toContain(normalise(paragraph.textContent));
	}
});

test('the Markdown has every homepage link', () => {
	const markdownLines = homeMarkdown().split('\n');
	const links = getRenderedHome().querySelectorAll('a');

	expect(links.length).toBe(2);
	for (const link of links) {
		expect(markdownLines).toContain(
			`- [${normalise(link.textContent)}](${link.getAttribute('href')})`,
		);
	}
});

test('the Markdown has the install command as a shell code block', () => {
	const command = normalise(getRenderedHome().querySelector('pre code')?.textContent);

	expect(command).toBe('pnpm add @luke-ui/react react-aria-components');
	expect(homeMarkdown()).toContain(`\`\`\`sh\n${command}\n\`\`\``);
});

function normalise(text: string | null | undefined) {
	return (text ?? '').replaceAll(WHITESPACE_PATTERN, ' ').trim();
}

function getRenderedHome() {
	if (!container) throw new Error('homepage not rendered');
	return container;
}

async function renderHomepage() {
	const rootRoute = createRootRoute({
		component: () => (
			<RootProvider search={{}} theme={{ defaultTheme: 'light', enableSystem: false }}>
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot>
						<HeadingLevels base={1}>
							<HomeHero />
							<HomeFeatures />
						</HeadingLevels>
					</DocsThemeRoot>
				</IconSpritesheetProvider>
			</RootProvider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute,
	});

	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
