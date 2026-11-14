import { useSlotId } from '@react-aria/utils';
import type { JSX, ReactNode, Ref } from 'react';
import type { DialogProps as RacDialogProps } from 'react-aria-components/Dialog';
import { Dialog as RacDialog } from 'react-aria-components/Dialog';
import { HeadingContext as RacHeadingContext } from 'react-aria-components/Heading';
import { TextContext as RacTextContext } from 'react-aria-components/Text';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { DEFAULT_SLOT, useSlottedContext } from 'react-aria-components/slots';
import { cx } from '../../../shared/utils/utils.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { dialogContent } from './styles.css.js';

type _DialogContentOmit = DistributiveOmit<RacDialogProps, 'render' | 'role'>;

interface _DialogContentProps extends _DialogContentOmit {
	/**
	 * The dialog's content. Name the dialog with a `Heading` that has `slot="title"`, describe it with
	 * a `Text` that has `slot="description"`, and close it with a `Button` that has `slot="close"`.
	 */
	children?: RacDialogProps['children'];
	/** Forwarded to the dialog element. */
	ref?: Ref<HTMLElement>;
	/**
	 * The dialog's semantics. Use `alertdialog` for an urgent confirmation that needs a response,
	 * such as a destructive action.
	 * @default 'dialog'
	 */
	role?: RacDialogProps['role'];
}

/** Props for `DialogContent`. */
export type DialogContentProps = Prettify<_DialogContentProps>;

/**
 * The semantic dialog inside a `DialogSurface`. It contains focus while open and moves focus to
 * itself when it opens, unless a child sets `autoFocus`.
 *
 * A `Heading` with `slot="title"` names the dialog, and a `Text` with `slot="description"`
 * describes it, for both `dialog` and `alertdialog`. An explicit `aria-labelledby` or
 * `aria-describedby` takes precedence.
 */
export function DialogContent(props: DialogContentProps): JSX.Element {
	const { children, className, ...dialogProps } = props;
	// React Aria wires a described-by id only for `alertdialog`. This id resolves only when an
	// element renders with it, so an empty slot adds no reference.
	const descriptionId = useSlotId();

	return (
		<RacDialog
			{...dialogProps}
			aria-describedby={dialogProps['aria-describedby'] ?? descriptionId}
			className={cx(dialogContent, className)}
		>
			{composeRenderProps(children, (resolvedChildren) => (
				<DialogTextSlots descriptionId={descriptionId}>{resolvedChildren}</DialogTextSlots>
			))}
		</RacDialog>
	);
}

/**
 * `Heading` and `Text` both render React Aria's `Text`, so they read `TextContext`. React Aria's
 * dialog provides the title slot on `HeadingContext`, so this adds it to the text slots too.
 */
function DialogTextSlots({
	children,
	descriptionId,
}: {
	children: ReactNode;
	descriptionId: string | undefined;
}): JSX.Element {
	const titleProps = useSlottedContext(RacHeadingContext, 'title');
	const textSlots = {
		slots: {
			[DEFAULT_SLOT]: {},
			description: { id: descriptionId },
			title: { id: titleProps?.id },
		},
	};

	return <RacTextContext value={textSlots}>{children}</RacTextContext>;
}
