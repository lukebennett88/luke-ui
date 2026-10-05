import type { ComponentPropsWithRef, HTMLAttributes, JSX, RefAttributes } from 'react';
import { VisuallyHidden as RacVisuallyHidden } from 'react-aria-components/VisuallyHidden';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedElementTypeProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';

type _VisuallyHiddenOmit = DistributiveOmit<
	ComponentPropsWithRef<typeof RacVisuallyHidden>,
	keyof DocumentedElementTypeProps
>;

type _VisuallyHiddenDomProps = DistributiveOmit<
	HTMLAttributes<HTMLElement>,
	keyof ComponentPropsWithRef<typeof RacVisuallyHidden> & keyof HTMLAttributes<HTMLElement>
>;

interface _VisuallyHiddenProps
	extends
		_VisuallyHiddenOmit,
		_VisuallyHiddenDomProps,
		DocumentedElementTypeProps,
		RefAttributes<HTMLElement> {
	/** Whether the content becomes visible when it or a descendant receives focus. */
	isFocusable?: ComponentPropsWithRef<typeof RacVisuallyHidden>['isFocusable'];
	/**
	 * Renders a different semantic element.
	 * @default 'span'
	 */
	elementType?: DocumentedElementTypeProps['elementType'];
}

/** Props for `VisuallyHidden`. */
export type VisuallyHiddenProps = Prettify<_VisuallyHiddenProps>;

/**
 * Hides its content visually while keeping it available to assistive technology.
 */
export function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element {
	const { elementType = 'span', ...racProps } = props;
	return <RacVisuallyHidden {...racProps} elementType={elementType} />;
}
