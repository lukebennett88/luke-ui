import type { ComponentProps, JSX } from 'react';
import type { Prettify } from '../../types/prettify.js';
import { NecessityMarker, useNecessityIndicator } from './label.js';
import type { NecessityIndicator } from './necessity-context.js';
import { fieldRecipe } from './recipe.css.js';

interface _InlineLabelTextProps extends ComponentProps<'span'> {
	/**
	 * Describes whether the associated control is required. It does not make the control required.
	 * Inside a Luke UI control root, the root's required state wins.
	 */
	isRequired?: boolean;
	/**
	 * Controls how the label identifies required or optional values. Inherits from `Form`, or uses
	 * `'required-asterisk'` when unset.
	 */
	necessityIndicator?: NecessityIndicator;
}

/** Props for `InlineLabelText`. */
export type InlineLabelTextProps = Prettify<_InlineLabelTextProps>;

/**
 * Label text for a custom checkbox or switch layout. Place it beside the control when the composed
 * field's label order does not fit.
 *
 * It draws a necessity marker from the surrounding control root, or from its own `isRequired` when
 * there is no root.
 */
export function InlineLabelText(props: InlineLabelTextProps): JSX.Element {
	const {
		children,
		className,
		isRequired,
		necessityIndicator: necessityIndicatorProp,
		...restProps
	} = props;
	const necessityIndicator = useNecessityIndicator(necessityIndicatorProp);

	return (
		<span
			{...restProps}
			className={fieldRecipe({ necessityIndicator }).inlineLabelText({ className })}
		>
			{children}
			<NecessityMarker isRequired={isRequired} necessityIndicator={necessityIndicator} />
		</span>
	);
}
