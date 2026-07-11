import { useEffect } from 'react';
import {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from '../../recipes/combobox.css.js';

/**
 * Mirrors the browser's Visual Viewport onto CSS custom properties set on `element`, so the mobile
 * combobox tray (see `recipes/combobox.css.ts`) can size itself against the space actually visible
 * above an on-screen keyboard instead of the full layout viewport. Modeled on the approach described
 * in Adobe Spectrum's combobox write-up (https://react-aria.adobe.com/blog/building-a-combobox).
 *
 * No-ops during SSR, when `element` is `null` (the popover isn't mounted while closed), and in
 * browsers without `visualViewport` support.
 */
export function useVisualViewportVars(element: HTMLElement | null): void {
	useEffect(() => {
		if (element === null) return;
		if (typeof window === 'undefined' || window.visualViewport == null) return;

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
		visualViewport.addEventListener('resize', update);
		visualViewport.addEventListener('scroll', update);

		return () => {
			visualViewport.removeEventListener('resize', update);
			visualViewport.removeEventListener('scroll', update);
		};
	}, [element]);
}
