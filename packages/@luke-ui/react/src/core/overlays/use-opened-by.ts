import { useState } from 'react';
import { useFocusVisible } from 'react-aria/useFocusVisible';

/** How the user opened an overlay, for the `data-opened-by` attribute. */
export type OpenedBy = 'keyboard' | 'pointer';

/**
 * Records how the overlay was last opened, so a keyboard-opened one can skip its entry motion.
 *
 * React Aria's focus-visible signal is true for every interaction modality except `pointer`, so
 * keyboard, virtual (assistive technology) and unknown opens all count as `keyboard`. The value is
 * read when `isOpen` turns true and kept through the exit, so a reopen during the exit takes the
 * modality of the reopening interaction.
 */
export function useOpenedBy(isOpen: boolean): OpenedBy | undefined {
	const { isFocusVisible } = useFocusVisible();
	const [wasOpen, setWasOpen] = useState(isOpen);
	const [openedBy, setOpenedBy] = useState<OpenedBy | undefined>(undefined);
	if (isOpen !== wasOpen) {
		setWasOpen(isOpen);
		if (isOpen) setOpenedBy(isFocusVisible ? 'keyboard' : 'pointer');
	}
	return openedBy;
}
