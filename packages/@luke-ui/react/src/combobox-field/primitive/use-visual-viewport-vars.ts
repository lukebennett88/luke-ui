import { useEffect } from 'react';
import {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from '../../recipes/combobox.css.js';

/** Sets the visible viewport height and keyboard inset on the mobile tray. */
export function useVisualViewportVars(element: HTMLElement | null): void {
	useEffect(() => {
		if (element === null) return;
		if (window.visualViewport == null) return;

		// Reassigned into locals so TypeScript keeps them narrowed to non-null inside `update`,
		// a nested function declaration whose narrowing TS can't otherwise carry over.
		const trayElement = element;
		const visualViewport = window.visualViewport;

		function update() {
			trayElement.style.setProperty(comboboxTrayViewportHeightVar, `${visualViewport.height}px`);
			const keyboardInset = Math.max(
				0,
				window.innerHeight - visualViewport.height - visualViewport.offsetTop,
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
		};
	}, [element]);
}
