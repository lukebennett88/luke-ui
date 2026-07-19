'use client';

import type { ComponentProps, JSX, ReactNode } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import {
	Dialog as RacDialog,
	DialogTrigger as RacDialogTrigger,
	Heading as RacHeading,
} from 'react-aria-components/Dialog';
import { Modal as RacModal, ModalOverlay as RacModalOverlay } from 'react-aria-components/Modal';
import type {
	ButtonProps as RacButtonProps,
	DialogProps as RacDialogProps,
	DialogTriggerProps as RacDialogTriggerProps,
	HeadingProps as RacHeadingProps,
	ModalOverlayProps as RacModalOverlayProps,
} from 'react-aria-components/Modal';
import * as styles from '../recipes/dialog.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

export type { RacDialogProps as DialogPrimitiveProps };
export type { RacDialogTriggerProps as DialogTriggerPrimitiveProps };

interface _DialogTriggerProps extends RacDialogTriggerProps {}

/**
 * Props for `DialogTrigger`.
 *
 * @tier composed
 */
export type DialogTriggerProps = Prettify<_DialogTriggerProps>;

/** Wraps content that opens the dialog on interaction. */
export function DialogTrigger(props: DialogTriggerProps): JSX.Element {
	return <RacDialogTrigger data-slot="dialog-trigger" {...props} />;
}

type _DialogCloseOmit = DistributiveOmit<RacButtonProps, 'slot'>;

interface _DialogCloseProps extends _DialogCloseOmit {
	className?: string;
}

/**
 * Props for `DialogClose`.
 *
 * @tier composed
 */
export type DialogCloseProps = Prettify<_DialogCloseProps>;

/** Renders a close button inside a dialog when placed with `slot="close"`. */
export function DialogClose({ className, ...props }: DialogCloseProps): JSX.Element {
	return (
		<RacButton
			slot="close"
			data-slot="dialog-close"
			className={cx(styles.dialogCloseButton(), className)}
			{...props}
		/>
	);
}

type _DialogOverlayOmit = DistributiveOmit<RacModalOverlayProps, 'children' | 'className'>;

interface _DialogOverlayProps extends _DialogOverlayOmit {
	className?: string;
	children: ReactNode;
}

/**
 * Props for `DialogOverlay`.
 *
 * @tier composed
 */
export type DialogOverlayProps = Prettify<_DialogOverlayProps>;

/** Backdrop overlay for the dialog. */
export function DialogOverlay({ className, children, ...props }: DialogOverlayProps): JSX.Element {
	return (
		<RacModalOverlay {...props} className={cx(styles.dialogOverlay(), className)}>
			{children}
		</RacModalOverlay>
	);
}

interface _DialogProps {
	className?: string;
	children: ReactNode;
	/**
	 * Whether to show the close button in the top-right corner.
	 * @default true
	 */
	showCloseButton?: boolean;
	/**
	 * Whether clicking outside or pressing Escape dismisses the dialog.
	 * @default true
	 */
	isDismissable?: RacModalOverlayProps['isDismissable'];
	/** Whether the dialog is open (controlled). */
	isOpen?: RacModalOverlayProps['isOpen'];
	/** Whether the dialog is open by default (uncontrolled). */
	defaultOpen?: RacModalOverlayProps['defaultOpen'];
	/** Handler called when the dialog's open state changes. */
	onOpenChange?: RacModalOverlayProps['onOpenChange'];
}

/**
 * Props for `Dialog`.
 *
 * @tier composed
 */
export type DialogProps = Prettify<_DialogProps>;

/** Modal dialog with overlay, content panel, and optional close button. */
export function Dialog({
	className,
	children,
	isDismissable = true,
	showCloseButton = true,
	...props
}: DialogProps): JSX.Element {
	return (
		<RacModalOverlay className={styles.dialogOverlay()} isDismissable={isDismissable} {...props}>
			<RacModal className={cx(styles.dialogContent(), className)}>
				<RacDialog className={styles.dialog()}>
					{children}
					{showCloseButton && <InternalCloseButton />}
				</RacDialog>
			</RacModal>
		</RacModalOverlay>
	);
}

function InternalCloseButton(): JSX.Element {
	return (
		<RacButton aria-label="Close" slot="close" className={styles.dialogCloseButton()}>
			<svg
				aria-hidden
				fill="none"
				focusable="false"
				height="16"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				viewBox="0 0 24 24"
				width="16"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</RacButton>
	);
}

/**
 * Props for `DialogHeader`.
 *
 * @tier composed
 */
export type DialogHeaderProps = ComponentProps<'div'>;

/** Header section of the dialog, typically containing `DialogTitle` and `DialogDescription`. */
export function DialogHeader({ className, ...props }: DialogHeaderProps): JSX.Element {
	return (
		<div data-slot="dialog-header" className={cx(styles.dialogHeader(), className)} {...props} />
	);
}

/**
 * Props for `DialogFooter`.
 *
 * @tier composed
 */
export type DialogFooterProps = ComponentProps<'div'> & {
	/**
	 * Whether to show a text close button at the end of the footer.
	 * @default false
	 */
	showCloseButton?: boolean;
};

/** Footer section of the dialog, typically containing action buttons. */
export function DialogFooter({
	className,
	children,
	showCloseButton = false,
	...props
}: DialogFooterProps): JSX.Element {
	return (
		<div data-slot="dialog-footer" className={cx(styles.dialogFooter(), className)} {...props}>
			{children}
			{showCloseButton && <DialogClose>Close</DialogClose>}
		</div>
	);
}

type _DialogTitleOmit = DistributiveOmit<RacHeadingProps, 'slot'>;

interface _DialogTitleProps extends _DialogTitleOmit {
	className?: string;
}

/**
 * Props for `DialogTitle`.
 *
 * @tier composed
 */
export type DialogTitleProps = Prettify<_DialogTitleProps>;

/** Dialog title rendered as a heading. */
export function DialogTitle({ className, ...props }: _DialogTitleProps): JSX.Element {
	return (
		<RacHeading
			slot="title"
			data-slot="dialog-title"
			className={cx(styles.dialogTitle(), className)}
			{...props}
		/>
	);
}

/**
 * Props for `DialogDescription`.
 *
 * @tier composed
 */
export type DialogDescriptionProps = ComponentProps<'div'>;

/** Descriptive text or content within the dialog body. */
export function DialogDescription({ className, ...props }: DialogDescriptionProps): JSX.Element {
	return (
		<div
			data-slot="dialog-description"
			className={cx(styles.dialogDescription(), className)}
			{...props}
		/>
	);
}
