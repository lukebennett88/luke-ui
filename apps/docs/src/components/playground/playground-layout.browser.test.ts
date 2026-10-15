import '../../styles/app.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import * as styles from './playground.css.js';

let group: HTMLDivElement | undefined;

afterEach(async () => {
	group?.remove();
	group = undefined;
	await page.viewport(1024, 800);
});

test('uses the desktop panel layout before JavaScript corrects the server orientation', async () => {
	await page.viewport(1024, 800);
	renderPanelLayout('column');

	expect(getComputedStyle(group as HTMLDivElement).flexDirection).toBe('row');
});

test('uses the mobile panel layout independently of the JavaScript orientation', async () => {
	await page.viewport(390, 800);
	renderPanelLayout('row');

	expect(getComputedStyle(group as HTMLDivElement).flexDirection).toBe('column');
});

function renderPanelLayout(inlineDirection: 'column' | 'row') {
	group = document.createElement('div');
	group.className = styles.panelGroup;
	group.style.cssText = `display: flex; flex-direction: ${inlineDirection}; block-size: 400px`;

	const separator = document.createElement('div');
	separator.className = styles.separator;
	group.append(separator);
	document.body.append(group);

	return separator;
}
