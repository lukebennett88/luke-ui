import { mergeRefs } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import { useState } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import { themeRootClassName } from '../../theme/index.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';
import { useVisualViewportVars } from './use-visual-viewport-vars.js';

/**
 * Props for the styled combobox popover.
 *
 * @tier primitive
 */
export interface ComboboxPopoverProps extends DistributiveOmit<
	RacPopoverProps,
	'UNSTABLE_portalContainer'
> {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/**
 * Popover surface used for listbox content. The portal preserves the theme identity and explicit
 * colour mode active at its trigger.
 */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { ref, ...restProps } = props;
	const [element, setElement] = useState<HTMLElement | null>(null);
	useVisualViewportVars(element);

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return cx(themeRootClassName, styles.comboboxPopover(), className);
			})}
			ref={mergeRefs(ref, (node: HTMLElement | null) => {
				setElement(node);
				if (node === null) return;

				const themeSource = props.triggerRef?.current ?? document.activeElement;
				if (!(themeSource instanceof Element)) return;

				carryThemeScope(themeSource, node);
			})}
		/>
	);
}

function carryThemeScope(source: Element, portal: HTMLElement) {
	const identityClassName = findThemeIdentity(source);
	if (identityClassName !== undefined) portal.classList.add(identityClassName);

	const modeRoot = source.closest<HTMLElement>('[data-color-mode]');
	const mode = modeRoot?.dataset.colorMode;
	if (mode === 'light' || mode === 'dark') portal.dataset.colorMode = mode;
}

function findThemeIdentity(source: Element) {
	let identityClassName: string | undefined;
	let ancestor: Element | null = source;

	while (ancestor !== null) {
		for (const className of ancestor.classList) {
			// Keep the outer identity because nested identities are not supported.
			if (className.startsWith('luke-ui-theme-')) identityClassName = className;
		}
		ancestor = ancestor.parentElement;
	}

	return identityClassName;
}
