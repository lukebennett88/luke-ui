import type { JSX, ReactNode } from 'react';
import type { FieldNecessityIndicator } from './recipe.css.js';
import { fieldRecipe } from './recipe.css.js';

interface InlineLabelTextProps {
	/** The composed field's `label` content. */
	children: ReactNode;
	/** How a required control is marked. */
	necessityIndicator: FieldNecessityIndicator | undefined;
}

/**
 * The text of a composed inline field's label, such as `CheckboxField` or `SwitchField`. It is
 * private to the composed fields: primitive consumers own their label content.
 *
 * It draws the required marker after the label's last inline content, so the marker follows the
 * final word when the label wraps.
 */
export function InlineLabelText(props: InlineLabelTextProps): JSX.Element {
	const { children, necessityIndicator = 'icon' } = props;

	return <span className={fieldRecipe({ necessityIndicator }).inlineLabelText()}>{children}</span>;
}
