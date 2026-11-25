import type { JSX, ReactNode, Ref } from 'react';
import { use } from 'react';
import type { DialogProps as RacDialogProps } from 'react-aria-components/Dialog';
import { Dialog as RacDialog } from 'react-aria-components/Dialog';
import { HeadingContext as RacHeadingContext } from 'react-aria-components/Heading';
import { TextContext as RacTextContext } from 'react-aria-components/Text';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import { cx } from '../../../shared/utils/utils.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { dialogContent } from './styles.css.js';

type _DialogContentOmit = DistributiveOmit<RacDialogProps, 'render' | 'role'>;

interface _DialogContentProps extends _DialogContentOmit {
	/**
	 * The dialog's content. Name the dialog with a `Heading` that has `slot="title"`, and close it with
	 * a `Button` that has `slot="close"`.
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
 * The semantic dialog inside a `DialogSurface`. It moves focus to itself when it opens, unless a
 * child sets `autoFocus`.
 *
 * A `Heading` with `slot="title"` names the dialog. To describe it, pass the id of a short
 * description as `aria-describedby`. An `alertdialog` is also described by a `Text` with
 * `slot="description"`.
 */
export function DialogContent(props: DialogContentProps): JSX.Element {
	const { children, className, ...dialogProps } = props;

	return (
		<RacDialog {...dialogProps} className={cx(dialogContent, className)}>
			{composeRenderProps(children, (resolvedChildren) => (
				<DialogTitleSlot>{resolvedChildren}</DialogTitleSlot>
			))}
		</RacDialog>
	);
}

/**
 * `Heading` renders React Aria's `Text`, so it reads `TextContext`. React Aria's dialog provides the
 * title slot on `HeadingContext`, so this adds it to the text slots the dialog already provides.
 */
function DialogTitleSlot({ children }: { children: ReactNode }): JSX.Element {
	const titleProps = useSlottedContext(RacHeadingContext, 'title');
	const textContext = use(RacTextContext);
	const textSlots = textContext != null && 'slots' in textContext ? textContext.slots : undefined;
	const value = { slots: { ...textSlots, title: { id: titleProps?.id } } };

	return <RacTextContext value={value}>{children}</RacTextContext>;
}
