import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { lockupRecipe } from '../../lockup/recipe.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

type _FieldErrorOmit = DistributiveOmit<RacFieldErrorProps, 'elementType' | 'render'>;

interface FieldErrorSharedProps extends _FieldErrorOmit {}

interface FieldErrorElementProps extends FieldErrorSharedProps {
	/** Renders a different element type in place of the default. */
	elementType?: RacFieldErrorProps['elementType'];
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

interface FieldErrorRenderRootProps extends FieldErrorSharedProps {
	/** Use `elementType` instead of `renderRoot` for a supported semantic element. */
	elementType?: never;
	/**
	 * Passes resolved DOM props and validation state to a caller-owned error root element.
	 */
	renderRoot: NonNullable<RacFieldErrorProps['render']>;
}

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<FieldErrorElementProps | FieldErrorRenderRootProps>;

/**
 * Validation message for a field, shown with a leading error icon while the field is invalid.
 *
 * The icon is centred on the message's first line. Wrapped lines align with the text, not the icon.
 */
export function FieldError(props: FieldErrorProps): JSX.Element {
	const { body, rail, root } = lockupRecipe();
	const { icon, message } = fieldRecipe({ tone: 'error' });
	const { elementType, renderRoot, ...errorProps } = props;

	return (
		<RacFieldError
			{...errorProps}
			// The message is the Lockup root. Its children are one `body` element, not a flex item
			// per child, so a message with mixed inline content (text, a link, emphasis) flows as one
			// run of text. React Aria also accepts a children render function here, and a message with
			// no children falls back to the field's native validation message.
			className={composeRenderProps(props.className, (className) => {
				return message({ className: root({ className }) });
			})}
			elementType={renderRoot ? undefined : elementType}
			render={renderRoot}
		>
			{composeRenderProps(props.children, (children, { defaultChildren }) => {
				const content = children ?? defaultChildren;
				if (content == null) return null;

				return (
					<>
						<span aria-hidden="true" className={rail({ className: icon() })} />
						<span className={body()}>{content}</span>
					</>
				);
			})}
		</RacFieldError>
	);
}
