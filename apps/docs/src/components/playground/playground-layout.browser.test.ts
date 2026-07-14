import '../../styles/app.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';

let group: HTMLDivElement | undefined;

afterEach(async () => {
	group?.remove();
	group = undefined;
	await page.viewport(1024, 800);
});

test('uses the desktop panel layout before JavaScript corrects the server orientation', async () => {
	await page.viewport(1024, 800);
	const separator = renderPanelLayout('column');

	expect(getComputedStyle(group as HTMLDivElement).flexDirection).toBe('row');
	expect(getComputedStyle(separator).cursor).toBe('col-resize');
	expect(getComputedStyle(separator).inlineSize).toBe('1px');
	expect(getComputedStyle(separator).blockSize).toBe('400px');
});

test('uses the mobile panel layout independently of the JavaScript orientation', async () => {
	await page.viewport(390, 800);
	const separator = renderPanelLayout('row');

	expect(getComputedStyle(group as HTMLDivElement).flexDirection).toBe('column');
	expect(getComputedStyle(separator).cursor).toBe('row-resize');
	expect(getComputedStyle(separator).inlineSize).toBe('390px');
	expect(getComputedStyle(separator).blockSize).toBe('1px');
});

function renderPanelLayout(inlineDirection: 'column' | 'row') {
	group = document.createElement('div');
	group.className = 'min-h-0 flex-1 flex-col! md:flex-row!';
	group.style.cssText = `display: flex; flex-direction: ${inlineDirection}; block-size: 400px`;

	const separator = document.createElement('div');
	separator.className =
		"relative z-10 shrink-0 [block-size:1px] [inline-size:auto] cursor-row-resize bg-fd-border before:absolute before:[inset-block:-0.5rem] before:[inset-inline:0] before:content-[''] after:absolute after:[block-size:0.125rem] after:[inline-size:2rem] after:rounded-full after:bg-fd-border after:transition-colors after:-translate-x-1/2 after:-translate-y-1/2 after:inset-bs-[50%] after:inset-s-[50%] after:content-[''] data-[separator=active]:after:bg-fd-muted-foreground/60 data-[separator=focus]:after:bg-fd-muted-foreground/60 data-[separator=hover]:after:bg-fd-muted-foreground/50 md:[block-size:auto] md:[inline-size:1px] md:cursor-col-resize md:before:[inset-block:0] md:before:[inset-inline:-0.5rem] md:after:[block-size:2rem] md:after:[inline-size:0.125rem]";
	group.append(separator);
	document.body.append(group);

	return separator;
}
