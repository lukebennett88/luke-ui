import '../../styles/app.css';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { afterEach, expect, test } from 'vite-plus/test';
import { commands, page } from 'vite-plus/test/context';
import { RESIZE_TARGET_MINIMUM_SIZE } from './resize-target';

const GROUP_WIDTH = 600;
const GROUP_HEIGHT = 300;

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('resizes when the drag starts at the edge of the pointer hit target', async () => {
	// Match the iframe's content viewport to the harness size below so
	// Playwright's page-space coordinates map 1:1 onto the separator's own
	// coordinate system (otherwise the harness page can be scaled to fit the
	// runner viewport, throwing off the pixel-precise offsets this test relies
	// on).
	await page.viewport(GROUP_WIDTH, GROUP_HEIGHT);
	const firstPanel = renderLayout();
	const widthBefore = firstPanel.current?.getBoundingClientRect().width ?? 0;

	// 7px out from the separator's centre: inside the 16px band we configure,
	// outside the 10px the library defaults to. Deliberately a literal rather
	// than derived from RESIZE_TARGET_MINIMUM_SIZE — a derived offset would
	// shrink along with the band and pass no matter how narrow it got.
	await commands.dragFromSeparator(7, -100);

	await expect
		.poll(() => firstPanel.current?.getBoundingClientRect().width ?? 0)
		.toBeLessThan(widthBefore - 50);
});

test('does not resize when the drag starts outside the pointer hit target', async () => {
	await page.viewport(GROUP_WIDTH, GROUP_HEIGHT);
	const firstPanel = renderLayout();
	const widthBefore = firstPanel.current?.getBoundingClientRect().width ?? 0;

	// 12px out, past the edge of the band. Pins the upper bound so the grab
	// area cannot quietly swallow clicks meant for the panes either side.
	await commands.dragFromSeparator(12, -100);

	const widthAfter = firstPanel.current?.getBoundingClientRect().width ?? 0;
	expect(Math.abs(widthAfter - widthBefore)).toBeLessThan(3);
});

function renderLayout() {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	const firstPanel: { current: HTMLDivElement | null } = { current: null };

	act(() => {
		root?.render(<Harness firstPanelRef={firstPanel} />);
	});

	return firstPanel;
}

function Harness({ firstPanelRef }: { firstPanelRef: { current: HTMLDivElement | null } }) {
	return (
		<Group
			orientation="horizontal"
			resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
			style={{ blockSize: GROUP_HEIGHT, display: 'flex', inlineSize: GROUP_WIDTH }}
		>
			<Panel
				defaultSize="50%"
				elementRef={(element) => {
					firstPanelRef.current = element;
				}}
				minSize={80}
			/>
			<Separator
				aria-label="Resize panels"
				className="relative z-10 shrink-0"
				style={{ inlineSize: 1 }}
			/>
			<Panel defaultSize="50%" minSize={80} />
		</Group>
	);
}
