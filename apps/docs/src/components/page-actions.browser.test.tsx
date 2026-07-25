import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
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
});

const githubUrl = 'https://github.com/example/repo/edit/main/page.mdx';
const markdownUrl = '/example-page.md';
const storybookUrl = 'https://storybook.example/?path=/docs/example--docs';

test('collapses into a single trigger until opened', async () => {
	renderActions({ githubUrl, markdownUrl, storybookUrl });

	await expect.element(page.getByRole('button', { name: 'View options' })).toBeVisible();
	expect(page.getByRole('link', { name: 'Edit on GitHub' })).not.toBeInTheDocument();
	expect(page.getByRole('link', { name: 'View as Markdown' })).not.toBeInTheDocument();
	expect(page.getByRole('button', { name: 'Copy Markdown' })).not.toBeInTheDocument();
});

test('opening the control surfaces every destination, labelled and reachable', async () => {
	renderActions({ githubUrl, markdownUrl, storybookUrl });

	await userEvent.click(page.getByRole('button', { name: 'View options' }));

	await expect.element(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
	await expect
		.element(page.getByRole('link', { name: 'View as Markdown' }))
		.toHaveAttribute('href', markdownUrl);
	await expect
		.element(page.getByRole('link', { name: 'View in Storybook' }))
		.toHaveAttribute('href', storybookUrl);
	await expect
		.element(page.getByRole('link', { name: 'Edit on GitHub' }))
		.toHaveAttribute('href', githubUrl);
});

test('omits the Storybook destination when the page has none', async () => {
	renderActions({ githubUrl, markdownUrl, storybookUrl: null });

	await userEvent.click(page.getByRole('button', { name: 'View options' }));

	await expect.element(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
	expect(page.getByRole('link', { name: 'View in Storybook' })).not.toBeInTheDocument();
});

test('is keyboard operable: Enter opens it, Tab moves through items, Escape returns focus to the trigger', async () => {
	renderActions({ githubUrl, markdownUrl, storybookUrl: null });

	const trigger = page.getByRole('button', { name: 'View options' });
	await userEvent.tab();
	await expect.element(trigger).toHaveFocus();

	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Copy Markdown' })).toHaveFocus();

	await userEvent.tab();
	await expect.element(page.getByRole('link', { name: 'View as Markdown' })).toHaveFocus();

	await userEvent.keyboard('{Escape}');
	await expect.element(trigger).toHaveFocus();
	expect(page.getByRole('link', { name: 'View as Markdown' })).not.toBeInTheDocument();
});

function renderActions(props: {
	githubUrl: string;
	markdownUrl: string;
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
