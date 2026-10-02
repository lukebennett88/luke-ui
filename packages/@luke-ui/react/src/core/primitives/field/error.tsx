import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { trackRecipe } from '../../track/recipe.css.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<RacFieldErrorProps>;

/**
 * Validation message for a field, shown with a leading error icon while the field is invalid.
 *
 * The icon is centred on the message's first line. Wrapped lines align with the text, not the icon.
 */
export function FieldError(props: FieldErrorProps): JSX.Element {
	const { centre, rail, root } = trackRecipe({ railAlignment: 'firstLine' });
	const { icon, message } = fieldRecipe({ tone: 'error' });

	return (
		<RacFieldError
			{...props}
			// The message is the Track root. Its children are one `centre` element, not a flex item
			// per child, so a message with mixed inline content (text, a link, emphasis) flows as one
			// run of text. React Aria also accepts a render function here, and a message with no
			// children falls back to the field's native validation message.
			className={composeRenderProps(props.className, (className) => {
				return message({ className: root({ className }) });
			})}
		>
			{composeRenderProps(props.children, (children, { defaultChildren }) => {
				const content = children ?? defaultChildren;
				if (content == null) return null;

				return (
					<>
						<span aria-hidden="true" className={rail({ className: icon() })} />
						<span className={centre()}>{content}</span>
					</>
				);
			})}
		</RacFieldError>
	);
}
