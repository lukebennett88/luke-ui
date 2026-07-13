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

		console.log('[tray-debug] hook mounted', { element, hasVisualViewport: window.visualViewport != null });

		// Reassigned into locals so TypeScript keeps them narrowed to non-null inside `update`,
		// a nested function declaration whose narrowing TS can't otherwise carry over.
		const trayElement = element;
		const visualViewport = window.visualViewport;

		// `combobox.css.ts` pins the tray's `insetBlockEnd` to `0 !important`, so the
		// browser has already decided where the fixed containing block's bottom edge
		// sits — above the keyboard on browsers where `position: fixed` is clipped to
		// the visual viewport, or behind it where fixed elements still extend to the
		// full layout viewport/physical screen. Rather than guess which model a given
		// browser/OS/version uses, read the tray's own rendered bottom edge and diff it
		// against the visual viewport's true visible bottom: a zero delta means the box
		// already stops above the keyboard (no compensation needed), a positive delta
		// means it doesn't (that delta is exactly the padding needed to lift content
		// clear of the keyboard). This measurement is self-correcting either way, with
		// no feedback loop: `paddingBlockEnd` (driven by `keyboardInset`) lives inside
		// the box, while `insetBlockEnd: 0` pins the outer bottom edge regardless of
		// padding, so the rect's bottom edge doesn't shift between calls.
		function update(trigger: string) {
			trayElement.style.setProperty(comboboxTrayViewportHeightVar, `${visualViewport.height}px`);
			const visibleBottom = visualViewport.offsetTop + visualViewport.height;
			const trayRect = trayElement.getBoundingClientRect();
			const trayBottom = trayRect.bottom;
			const keyboardInset = Math.max(0, trayBottom - visibleBottom);
			trayElement.style.setProperty(comboboxTrayKeyboardInsetVar, `${keyboardInset}px`);

			console.log('[tray-debug] update', {
				trigger,
				visualViewportHeight: visualViewport.height,
				visualViewportOffsetTop: visualViewport.offsetTop,
				visualViewportWidth: visualViewport.width,
				windowInnerHeight: window.innerHeight,
				windowInnerWidth: window.innerWidth,
				screenHeight: window.screen.height,
				trayRectTop: trayRect.top,
				trayRectBottom: trayRect.bottom,
				trayRectHeight: trayRect.height,
				keyboardInset,
				visibleBottom,
				scrollY: window.scrollY,
			});
		}

		update('mount');

		// The tray slides in/out via a `translate` transition (see the `data-entering`/
		// `data-exiting` selectors in `combobox.css.ts`), and RAC keeps it mounted for the
		// full transition. The initial `update()` call above can land mid-transition — before
		// the tray has slid up to its resting position — so `getBoundingClientRect()` briefly
		// reports an offset that doesn't reflect where the tray actually settles. Re-measuring
		// once that transition ends corrects any such stale reading.
		function handleTransitionEnd(event: TransitionEvent) {
			if (event.target !== trayElement) return;
			if (event.propertyName !== 'translate') return;
			update('transitionend');
		}
		trayElement.addEventListener('transitionend', handleTransitionEnd);

		// VisualViewport is not an Element, so ResizeObserver cannot observe it. Scroll also reports
		// changes to offsetTop that do not resize the viewport.
		function handleResize() {
			update('resize');
		}
		function handleScroll() {
			update('scroll');
		}
		visualViewport.addEventListener('resize', handleResize);
		visualViewport.addEventListener('scroll', handleScroll);

		return () => {
			visualViewport.removeEventListener('resize', handleResize);
			visualViewport.removeEventListener('scroll', handleScroll);
			trayElement.removeEventListener('transitionend', handleTransitionEnd);
		};
	}, [element]);
}
