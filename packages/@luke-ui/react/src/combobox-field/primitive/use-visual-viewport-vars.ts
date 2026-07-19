import { useEffect } from 'react';
import {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from '../../recipes/combobox-viewport-vars.js';

/** Sets the visible viewport height and keyboard inset on the mobile tray. */
export function useVisualViewportVars(element: HTMLElement | null): void {
	useEffect(() => {
		if (element === null) return;
		if (window.visualViewport == null) return;

		// Reassigned into locals so TypeScript keeps them narrowed to non-null inside `update`,
		// a nested function declaration whose narrowing TS can't otherwise carry over.
		const trayElement = element;
		const visualViewport = window.visualViewport;

		// `innerHeight`/`clientHeight` don't reliably report the fixed-position containing
		// block's height across browsers: on iOS Safari `innerHeight` tracks the visual
		// viewport, so it shrinks with the keyboard and the old inset math collapsed to ~0.
		// A probe pinned to all four edges via `inset: 0` measures that containing block
		// directly, by construction, regardless of toolbar/keyboard state.
		const probe = document.createElement('div');
		probe.style.position = 'fixed';
		probe.style.inset = '0';
		probe.style.visibility = 'hidden';
		probe.style.pointerEvents = 'none';
		document.body.append(probe);

		function update() {
			trayElement.style.setProperty(comboboxTrayViewportHeightVar, `${visualViewport.height}px`);
			// Read fresh each call in case the containing block itself changes (e.g. toolbar show/hide).
			const probeHeight = probe.getBoundingClientRect().height;
			const keyboardInset = Math.max(
				0,
				probeHeight - visualViewport.offsetTop - visualViewport.height,
			);
			trayElement.style.setProperty(comboboxTrayKeyboardInsetVar, `${keyboardInset}px`);
		}

		update();
		// VisualViewport is not an Element, so ResizeObserver cannot observe it. Scroll also reports
		// changes to offsetTop that do not resize the viewport.
		visualViewport.addEventListener('resize', update);
		visualViewport.addEventListener('scroll', update);

		return () => {
			visualViewport.removeEventListener('resize', update);
			visualViewport.removeEventListener('scroll', update);
			probe.remove();
		};
	}, [element]);
}
