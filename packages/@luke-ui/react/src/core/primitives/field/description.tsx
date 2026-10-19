import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

type _FieldDescriptionOmit = DistributiveOmit<
	RacTextProps,
	'elementType' | 'id' | 'render' | 'slot'
>;

interface FieldDescriptionSharedProps extends _FieldDescriptionOmit {
	/** Element id referenced by `aria-describedby` on the control. */
	id?: RacTextProps['id'];
}

interface FieldDescriptionElementProps extends FieldDescriptionSharedProps {
	/** Renders a different element type in place of the default. */
	elementType?: RacTextProps['elementType'];
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

interface FieldDescriptionRenderRootProps extends FieldDescriptionSharedProps {
	/** Use `elementType` instead of `renderRoot` for a supported semantic element. */
	elementType?: never;
	/**
	 * Passes resolved DOM props to a caller-owned description root element.
	 */
	renderRoot: NonNullable<RacTextProps['render']>;
}

/** Props for `FieldDescription`. */
export type FieldDescriptionProps = Prettify<
	FieldDescriptionElementProps | FieldDescriptionRenderRootProps
>;

/**
 * Styled helper text for a field. Anywhere inside a control root, it describes the control
 * automatically.
 */
export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
	const { className, elementType, renderRoot, ...restProps } = props;

	return (
		<RacText
			{...restProps}
			className={fieldRecipe({ tone: 'description' }).message({ className })}
			elementType={renderRoot ? undefined : elementType}
			render={renderRoot}
			slot="description"
		/>
	);
}
