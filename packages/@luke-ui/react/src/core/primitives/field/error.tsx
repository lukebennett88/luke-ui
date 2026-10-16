import type { JSX, Ref } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { Text } from '../../text/text.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

type _FieldErrorOmit = DistributiveOmit<RacFieldErrorProps, 'elementType'>;

interface _FieldErrorProps extends _FieldErrorOmit {
	/** Ref to the message element. */
	ref?: Ref<HTMLDivElement>;
}

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<_FieldErrorProps>;

/**
 * Validation message for a field, shown with a leading error icon while the field is invalid.
 *
 * The icon is centred on the first line's capitals. Wrapped lines align with the message text. The
 * message renders a `div`, so it can hold block content such as a list.
 */
export function FieldError(props: FieldErrorProps): JSX.Element {
	const { render, ...otherProps } = props;

	return (
		<RacFieldError
			{...otherProps}
			elementType="div"
			// React Aria resolves the state-aware props, the native validation message, and the id
			// that describes the control. `Text` renders that root with the icon as its adornment.
			render={(domProps, state) => {
				return (
					<Text
						{...domProps}
						color="danger"
						elementType="div"
						fontWeight="body"
						// The icon's inline size assumes this gap. See `errorIconGap`.
						gap="sp8"
						render={render == null ? undefined : (textProps) => render(textProps, state)}
						shouldDisableTrim
						slot={null}
						startContent={
							<span aria-hidden="true" className={fieldRecipe({ tone: 'error' }).icon()} />
						}
						typography="label"
					/>
				);
			}}
		/>
	);
}
