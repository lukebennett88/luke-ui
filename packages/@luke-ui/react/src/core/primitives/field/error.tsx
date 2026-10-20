import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { lockupRecipe } from '../../lockup/recipe.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<
	DistributiveOmit<RacFieldErrorProps, 'elementType' | 'render'>
>;

/**
 * Block validation content for a field, shown with a leading error icon while the field is invalid.
 *
 * Supports inline messages and structured content such as lists. The icon is centred on the first
 * line, and wrapped lines align with the message rather than the icon.
 */
export function FieldError(props: FieldErrorProps): JSX.Element {
	const { body, rail, root } = lockupRecipe();
	const { icon, message } = fieldRecipe({ tone: 'error' });

	return (
		<RacFieldError
			{...props}
			elementType="div"
			// The message is the Lockup root. Its children are one `body` element, not a flex item
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
						<div className={body()}>{content}</div>
					</>
				);
			})}
		</RacFieldError>
	);
}
