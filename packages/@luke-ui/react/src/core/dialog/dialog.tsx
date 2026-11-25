import type { CSSProperties, JSX, ReactNode, Ref } from 'react';
import { useId } from 'react';
import { Heading } from '../heading/heading.js';
import { IconButton } from '../icon-button/icon-button.js';
import { Lockup, LockupBody, LockupRail } from '../lockup/lockup.js';
import { ControlSizeContext } from '../sizing/control-size-context.js';
import { Stack } from '../stack/stack.js';
import { Text } from '../text/text.js';
import type { Prettify } from '../types/prettify.js';
import type { DialogContentProps } from './primitive/content.js';
import { DialogContent } from './primitive/content.js';
import type { DialogOverlayProps } from './primitive/overlay.js';
import { DialogOverlay } from './primitive/overlay.js';
import { DialogSurface } from './primitive/surface.js';
import { dialogCloseButtonRail } from './styles.css.js';

interface _DialogProps {
	/**
	 * The dialog's body, such as a form and its actions. Close the dialog with a `Button` that has
	 * `slot="close"`. Pass a function to receive `close`, for example to close the dialog after an
	 * async action finishes.
	 */
	children: ReactNode | ((renderProps: { close: () => void }) => ReactNode);
	/** Class name for the dialog element. */
	className?: string;
	/**
	 * A short sentence below the title that describes the dialog to assistive technology. Put longer
	 * or structured content, such as several paragraphs or a list, in `children`, where it is not
	 * announced as the description.
	 */
	description?: string;
	/** Element id for the dialog element. */
	id?: string;
	/**
	 * Whether the close button is disabled. Set it to `true` while an action is pending. It has no
	 * effect on Escape or a press outside the dialog.
	 * @default false
	 */
	isCloseButtonDisabled?: boolean;
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
	/**
	 * Whether the dialog is open (controlled). Omit it inside a `DialogTrigger`, which owns the open
	 * state.
	 */
	isOpen?: DialogOverlayProps['isOpen'];
	/**
	 * Called with `false` when a close button, Escape, or a press outside the dialog asks it to
	 * close. Pass it with `isOpen`. Inside a `DialogTrigger`, pass it to the trigger instead.
	 */
	onOpenChange?: DialogOverlayProps['onOpenChange'];
	/** Forwarded to the dialog element. */
	ref?: Ref<HTMLElement>;
	/**
	 * The dialog's semantics. Use `alertdialog` for an urgent confirmation that needs a response,
	 * such as a destructive action.
	 * @default 'dialog'
	 */
	role?: DialogContentProps['role'];
	/**
	 * Whether to show a close button at the inline end of the title. Avoid it in an `alertdialog`,
	 * which needs an explicit response.
	 * @default false
	 */
	showCloseButton?: boolean;
	/** Inline style for the dialog element. */
	style?: CSSProperties;
	/** The visible heading that names the dialog. */
	title: string;
}

/** Props for `Dialog`. */
export type DialogProps = Prettify<_DialogProps>;

/**
 * A modal dialog with a title, an optional description, and caller-owned content. Place it inside a
 * `DialogTrigger` after the trigger `Button`, or control it with `isOpen` and `onOpenChange`. The caller owns
 * any form and its validation, actions, pending state, and when to close.
 *
 * Focus moves into the dialog when it opens and returns to the previously focused element when it
 * closes. Controls inside it use the `medium` size rather than a surrounding `Form`'s
 * `controlSize`. `id`, `className`, `style`, and `ref` target the dialog element.
 */
export function Dialog(props: DialogProps): JSX.Element {
	const {
		children,
		description,
		isCloseButtonDisabled = false,
		isDismissable,
		isKeyboardDismissDisabled,
		isOpen,
		onOpenChange,
		showCloseButton = false,
		title,
		...contentProps
	} = props;
	const descriptionId = useId();

	return (
		<DialogOverlay
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={isKeyboardDismissDisabled}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<DialogSurface>
				<DialogContent {...contentProps} aria-describedby={description ? descriptionId : undefined}>
					{(renderProps) => (
						<ControlSizeContext value="medium">
							<Stack gap="space.24">
								<Stack gap="space.16">
									{/* Lockup centres the close button on the title's first line, measured with the
										typography it inherits, so its root renders as Text with the title's typography.
										The rail overhangs the padding so the button does not move the title. */}
									<Lockup
										gap="space.16"
										renderRoot={(domProps) => (
											<Text
												{...domProps}
												elementType="div"
												shouldDisableTrim
												typography="heading3"
											/>
										)}
									>
										<LockupBody
											renderRoot={(domProps) => (
												<Heading {...domProps} level={2} slot="title" typography="heading3" />
											)}
										>
											{title}
										</LockupBody>
										{showCloseButton ? (
											<LockupRail className={dialogCloseButtonRail}>
												<IconButton
													aria-label="Close"
													icon="close"
													isDisabled={isCloseButtonDisabled}
													prominence="low"
													size="small"
													slot="close"
												/>
											</LockupRail>
										) : null}
									</Lockup>
									{description ? (
										<Text color="secondary" elementType="p" id={descriptionId}>
											{description}
										</Text>
									) : null}
								</Stack>
								<Stack gap="space.16">
									{typeof children === 'function' ? children(renderProps) : children}
								</Stack>
							</Stack>
						</ControlSizeContext>
					)}
				</DialogContent>
			</DialogSurface>
		</DialogOverlay>
	);
}
