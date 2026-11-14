import type { CSSProperties, JSX, ReactNode, Ref } from 'react';
import { Heading } from '../heading/heading.js';
import { Stack } from '../stack/stack.js';
import { Text } from '../text/text.js';
import type { Prettify } from '../types/prettify.js';
import type { DialogContentProps } from './primitive/content.js';
import { DialogContent } from './primitive/content.js';
import type { DialogOverlayProps } from './primitive/overlay.js';
import { DialogOverlay } from './primitive/overlay.js';
import { DialogSurface } from './primitive/surface.js';

interface _DialogProps {
	/**
	 * The dialog's body, such as a form and its actions. Close the dialog with a `Button` that has
	 * `slot="close"`, or by setting `isOpen` to `false`.
	 */
	children: ReactNode;
	/** Class name for the dialog element. */
	className?: string;
	/** Text below the title that describes the dialog to assistive technology. Pass inline content. */
	description?: ReactNode;
	/** Element id for the dialog element. */
	id?: string;
	/**
	 * Whether pressing outside the dialog closes it. Set it to `false` while an action is pending.
	 * @default false
	 */
	isDismissable?: DialogOverlayProps['isDismissable'];
	/**
	 * Whether Escape is prevented from closing the dialog. Escape closes the dialog even when
	 * `isDismissable` is `false`, so set this to `true` to block it while an action is pending.
	 * @default false
	 */
	isKeyboardDismissDisabled?: DialogOverlayProps['isKeyboardDismissDisabled'];
	/** Whether the dialog is open. */
	isOpen: boolean;
	/**
	 * Called with `false` when a close button, Escape, or a press outside the dialog asks it to
	 * close. The dialog stays open until `isOpen` changes.
	 */
	onOpenChange: (isOpen: boolean) => void;
	/** Forwarded to the dialog element. */
	ref?: Ref<HTMLElement>;
	/**
	 * The dialog's semantics. Use `alertdialog` for an urgent confirmation that needs a response,
	 * such as a destructive action.
	 * @default 'dialog'
	 */
	role?: DialogContentProps['role'];
	/** Inline style for the dialog element. */
	style?: CSSProperties;
	/** The visible heading that names the dialog. */
	title: string;
}

/** Props for `Dialog`. */
export type DialogProps = Prettify<_DialogProps>;

/**
 * A modal dialog with a title, an optional description, and caller-owned content. The caller owns
 * the open state, any form and its validation, actions, pending state, and when to close.
 *
 * Focus moves into the dialog when it opens and returns to the previously focused element when it
 * closes. `id`, `className`, `style`, and `ref` target the dialog element.
 */
export function Dialog(props: DialogProps): JSX.Element {
	const {
		children,
		description,
		isDismissable,
		isKeyboardDismissDisabled,
		isOpen,
		onOpenChange,
		title,
		...contentProps
	} = props;

	return (
		<DialogOverlay
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={isKeyboardDismissDisabled}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<DialogSurface>
				<DialogContent {...contentProps}>
					<Stack gap="space.16">
						<Heading level={2} slot="title" typography="heading3">
							{title}
						</Heading>
						{description == null ? null : (
							<Text color="secondary" elementType="p" slot="description">
								{description}
							</Text>
						)}
						{children}
					</Stack>
				</DialogContent>
			</DialogSurface>
		</DialogOverlay>
	);
}
