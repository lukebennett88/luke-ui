import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import type { TextElementProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import * as styles from './reference-table.css.js';

/**
 * Utility props of `Box`, without its element and DOM props. Table elements are not `elementType`
 * options, so cells use `renderRoot` and keep Box spacing/colour props on the same object.
 */
export type TableElementBoxProps = Omit<
	BoxProps,
	keyof HTMLAttributes<HTMLElement> | 'elementType' | 'ref' | 'renderRoot'
>;

/**
 * Cell text: the label type style without cap-height trim, which would distort table rows.
 *
 * Keeps `elementType` so rich description cells can use a block container for MDX content. Omits
 * `renderRoot`; table cells do not need caller-owned roots.
 */
export function CellText(props: Omit<TextElementProps, 'shouldDisableTrim' | 'typography'>) {
	return <Text shouldDisableTrim typography="label" {...props} />;
}

/** The bordered, rounded table surface and the container that drives its narrow layout. */
export function ReferenceTableFrame({
	children,
	className,
	...props
}: { children: ReactNode } & ComponentProps<'div'>) {
	return (
		<Box {...props} className={cx(styles.frame, 'not-prose', className)} maxInlineSize="100%">
			<Box
				backgroundColor="surface.base"
				borderColor="decorative"
				borderRadius="surface"
				borderStyle="solid"
				borderWidth="thin"
				className={styles.table}
				inlineSize="100%"
				overflow="hidden"
				renderRoot={(domProps) => <table {...domProps} />}
			>
				{children}
			</Box>
		</Box>
	);
}

/** The subdued header row. Narrow widths hide it visually but keep columnheaders for AT. */
export function ReferenceTableHeader({ children }: { children: ReactNode }) {
	return (
		<Box
			backgroundColor="surface.subdued"
			className={styles.visuallyHiddenNarrow}
			renderRoot={(domProps) => <thead {...domProps} />}
		>
			<tr>{children}</tr>
		</Box>
	);
}

/** A start-aligned column header: secondary label-weight text with the table's cell padding. */
export function ReferenceHeaderCell({ children }: { children: ReactNode }) {
	return (
		<Box
			className={cx(styles.cell, styles.ruled)}
			paddingBlock="space.8"
			paddingInline="space.16"
			renderRoot={(domProps) => <th {...domProps} scope="col" />}
		>
			<CellText color="secondary" fontWeight="label">
				{children}
			</CellText>
		</Box>
	);
}

/** A data cell. Prefer this over inventing an `as` polymorphism helper. */
export function TableCell({
	children,
	className,
	colSpan,
	headers,
	id,
	...boxProps
}: TableElementBoxProps & {
	children?: ReactNode;
	className?: string;
	colSpan?: number;
	/** Space-separated `th` ids this cell belongs to when `scope` alone is not enough. */
	headers?: string;
	id?: string;
}) {
	return (
		<Box
			{...boxProps}
			className={className}
			renderRoot={(domProps) => <td {...domProps} colSpan={colSpan} headers={headers} id={id} />}
		>
			{children}
		</Box>
	);
}

/** A row header cell (`th scope="row"`). */
export function TableRowHeader({
	children,
	className,
	id,
	...boxProps
}: TableElementBoxProps & {
	children?: ReactNode;
	className?: string;
	id?: string;
}) {
	return (
		<Box
			{...boxProps}
			className={className}
			renderRoot={(domProps) => <th {...domProps} id={id} scope="row" />}
		>
			{children}
		</Box>
	);
}

/** A column header cell with Box spacing props. */
export function TableHeaderCell({
	children,
	className,
	scope = 'col',
	...boxProps
}: TableElementBoxProps & {
	children?: ReactNode;
	className?: string;
	scope?: 'col' | 'row';
}) {
	return (
		<Box
			{...boxProps}
			className={className}
			renderRoot={(domProps) => <th {...domProps} scope={scope} />}
		>
			{children}
		</Box>
	);
}

/** A `<col>` width hint. Hidden in the stacked layout with the columns it sizes. */
export function TableColumn({
	className,
	...boxProps
}: TableElementBoxProps & {
	className?: string;
}) {
	return (
		<Box {...boxProps} className={className} renderRoot={(domProps) => <col {...domProps} />} />
	);
}
