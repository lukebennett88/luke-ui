import { useViewportSize } from '@react-aria/utils';
import { useEffect } from 'react';
import {
	comboboxTrayScrollOffsetVar,
	comboboxTrayViewportHeightVar,
} from '../../recipes/combobox.css.js';

/** Sets the visible viewport height and the page scroll offset on the mobile tray. */
export function useTrayViewportVars(element: HTMLElement | null): void {
	// `useViewportSize` comes from `@react-aria/utils`, and originates as
	// `packages/react-aria/src/utils/useViewportSize.ts` in `adobe/react-spectrum`. It normalises
	// the measurement by `visualViewport.scale`, skips resize updates while pinch-zoomed, and on iOS
	// WebKit resizes early from a capture-phase `blur` so the tray drops promptly when the keyboard
	// dismisses.
	const { height } = useViewportSize();

	useEffect(() => {
		if (element === null) return;

		element.style.setProperty(comboboxTrayViewportHeightVar, `${height}px`);

		// React Aria's `ComboBox` opens its popover as non-modal, and `useOverlayPosition` wires
		// `useCloseOnScroll`, which closes the popover on a document scroll. The tray closes rather
		// than drifts, so the offset only has to be correct at the moment the tray opens. It exists
		// because the tray positions against the initial containing block, which is anchored to the
		// document rather than the viewport.
		element.style.setProperty(comboboxTrayScrollOffsetVar, `${window.scrollY}px`);
	}, [element, height]);
}
