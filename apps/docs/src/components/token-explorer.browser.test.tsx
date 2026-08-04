import '../styles/app.css';
import '@luke-ui/react/themes/tactile.css';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { tokenPurposeGroups } from '../lib/token-purpose-groups.js';
import { TokenExplorer } from './token-explorer.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('expands every purpose and omits mixed sample treatments', async () => {
	await renderExplorer();

	for (const group of tokenPurposeGroups) {
		const trigger = page
			.getByRole('button', { name: `${group.title} ${group.tokens.length}` })
			.element();
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
	}

	const typographyTrigger = page
		.getByRole('button', {
			name: `Typography ${tokenPurposeGroups.find((group) => group.id === 'typography')?.tokens.length}`,
		})
		.element();
	const panelId = typographyTrigger.getAttribute('aria-controls');
	if (panelId === null) throw new Error('Typography trigger has no disclosure panel.');

	const headers = Array.from(document.getElementById(panelId)?.querySelectorAll('th') ?? []).map(
		(header) => header.textContent?.trim(),
	);
	expect(headers).toEqual(['vars path', 'CSS variable']);
});

async function renderExplorer() {
	const rootRoute = createRootRoute({
		component: () => (
			<StoryWrapper>
				<TokenExplorer />
			</StoryWrapper>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/token-reference'] }),
		routeTree: rootRoute,
	});

	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
