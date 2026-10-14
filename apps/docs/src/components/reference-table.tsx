import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { createElement } from 'react';
import * as styles from './reference-table.css.js';

type TableElementType = 'col' | 'colgroup' | 'table' | 'tbody' | 'td' | 'th' | 'thead' | 'tr';

/** Utility props of `Box`, without its element and DOM props. */
type BoxUtilityProps = Omit<
	BoxProps,
	keyof HTMLAttributes<HTMLElement> | 'elementType' | 'ref' | 'renderRoot'
>;

/**
 * `Box` for a table element. Table elements are not `elementType` options, so this renders one
 * through `renderRoot`. Utility props go in `box`. DOM props such as `scope` and `colSpan` go on the
 * returned element, where `Box` does not apply them.
 */
export function TableBox({
	as,
	box,
	children,
	className,
	...elementProps
}: {
	as: TableElementType;
	box?: BoxUtilityProps;
	colSpan?: number;
	scope?: 'col' | 'row';
} & Omit<HTMLAttributes<HTMLElement>, 'color'>) {
	return (
		<Box
			{...box}
			className={className}
			renderRoot={(domProps) => createElement(as, { ...elementProps, ...domProps })}
		>
			{children}
		</Box>
	);
}

/** Cell text: the label type style without cap-height trim, which would distort table rows. */
export function CellText(props: TextProps) {
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
			<TableBox
				as="table"
				box={{
					backgroundColor: 'surface.base',
					borderColor: 'decorative',
					borderRadius: 'surface',
					borderStyle: 'solid',
					borderWidth: 'thin',
					inlineSize: '100%',
					overflow: 'hidden',
				}}
				className={styles.table}
			>
				{children}
			</TableBox>
		</Box>
	);
}

/** The subdued header row. The stacked narrow layout hides it. */
export function ReferenceTableHeader({ children }: { children: ReactNode }) {
	return (
		<TableBox as="thead" box={{ backgroundColor: 'surface.subdued' }} className={styles.hideNarrow}>
			<tr>{children}</tr>
		</TableBox>
	);
}

/** A start-aligned column header: secondary label-weight text with the table's cell padding. */
export function ReferenceHeaderCell({ children }: { children: ReactNode }) {
	return (
		<TableBox
			as="th"
			box={{ paddingBlock: 'sp8', paddingInline: 'sp16' }}
			className={styles.cell}
			data-ruled=""
			scope="col"
		>
			<CellText color="secondary" fontWeight="label">
				{children}
			</CellText>
		</TableBox>
	);
}
