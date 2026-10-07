import type { CSSProperties, DOMAttributes } from 'react';
import { useState } from 'react';
import { useFocusWithin } from 'react-aria/useFocusWithin';
import { visuallyHiddenStyle } from './visually-hidden-style.js';

interface UseVisuallyHiddenProps {
	/**
	 * When true, remove the visually-hidden treatment while focus is within the root or a
	 * descendant. Does not make anything focusable.
	 */
	isFocusable?: boolean;
	/** Consumer style. Wins over the hiding styles when both apply. */
	style?: CSSProperties;
}

interface UseVisuallyHiddenResult {
	/** Props to spread onto the visually hidden root. */
	visuallyHiddenProps: Pick<DOMAttributes<Element>, 'onBlur' | 'onFocus'> & {
		style: CSSProperties | undefined;
	};
}

/**
 * Resolves focus-within behaviour and hiding styles for Luke UI's visually hidden root.
 * Private: there is no demonstrated consumer need for a public hook.
 */
export function useVisuallyHidden(props: UseVisuallyHiddenProps = {}): UseVisuallyHiddenResult {
	const { isFocusable = false, style } = props;
	const [isFocusWithin, setFocusWithin] = useState(false);
	const { focusWithinProps } = useFocusWithin({
		isDisabled: !isFocusable,
		onFocusWithinChange: setFocusWithin,
	});

	const resolvedStyle =
		isFocusable && isFocusWithin
			? style
			: style
				? { ...visuallyHiddenStyle, ...style }
				: visuallyHiddenStyle;

	return {
		visuallyHiddenProps: {
			...focusWithinProps,
			style: resolvedStyle,
		},
	};
}
