import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { createElement, Fragment } from 'react';
import { InheritTypography } from './docs-article/mdx-elements.js';
import * as styles from './type-table.css.js';

interface ParameterNode {
	description: ReactNode;
	name: string;
}

/** Field shape produced by `fumadocs-typescript` / `remarkAutoTypeTable`. */
export interface TypeNode {
	default?: ReactNode;
	deprecated?: boolean;
	description?: ReactNode;
	parameters?: Array<ParameterNode>;
	required?: boolean;
	returns?: ReactNode;
	type: ReactNode;
	typeDescription?: ReactNode;
	typeDescriptionLink?: string;
}

/** Column and marker decisions that every row of one table shares. */
export interface PropTableLayout {
	columnCount: number;
	showDefault: boolean;
	showRequired: boolean;
}

/**
 * API reference table in the style of React Aria's prop tables: one Name | Type | Default row per
 * prop with its description beneath. Keeps the generated `TypeNode` contract. Everything is a
 * plain table, so descriptions and types are readable without interaction at every width.
 */
export function TypeTable({
	className,
	id,
	rowIdPrefix,
	type,
	...props
}: {
	/**
	 * Prefix for hash-targetable row ids (`${prefix}-${propName}`). Defaults to `id`. Pass this from
	 * `ComponentPropsTable` so grouped rows share one hash namespace without duplicate DOM ids.
	 */
	rowIdPrefix?: string;
	type: Record<string, TypeNode>;
} & ComponentProps<'div'>) {
	const layout = getPropTableLayout(Object.values(type));

	return (
		<PropTableFrame {...props} className={className} id={id}>
			<PropTableHead layout={layout} />
			<tbody className={styles.bodyGroup}>
				<PropRows hashPrefix={rowIdPrefix ?? id} layout={layout} type={type} />
			</tbody>
		</PropTableFrame>
	);
}

/**
 * Decides the Default column and the required marker over every prop the table will show, the way
 * React Aria does: a Default column only when some prop has a default, and a required marker only
 * when required and optional props are mixed.
 */
export function getPropTableLayout(nodes: ReadonlyArray<TypeNode>): PropTableLayout {
	const showDefault = nodes.some((node) => node.default !== undefined);
	const requiredCount = nodes.filter((node) => node.required === true).length;
	return {
		columnCount: showDefault ? 3 : 2,
		showDefault,
		showRequired: requiredCount > 0 && requiredCount < nodes.length,
	};
}

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
export function PropTableFrame({
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

export function PropTableHead({ layout }: { layout: PropTableLayout }) {
	const headers = layout.showDefault ? ['Name', 'Type', 'Default'] : ['Name', 'Type'];

	return (
		<Fragment>
			<colgroup>
				<TableBox as="col" box={{ inlineSize: '30%' }} className={styles.hideNarrow} />
				<col />
				{layout.showDefault ? (
					<TableBox as="col" box={{ inlineSize: '20%' }} className={styles.hideNarrow} />
				) : null}
			</colgroup>
			<TableBox
				as="thead"
				box={{ backgroundColor: 'surface.subdued' }}
				className={styles.hideNarrow}
			>
				<tr>
					{headers.map((header) => (
						<TableBox
							as="th"
							box={{ paddingBlock: 'sp8', paddingInline: 'sp16' }}
							className={styles.cell}
							data-ruled=""
							key={header}
							scope="col"
						>
							<CellText color="secondary" fontWeight="label">
								{header}
							</CellText>
						</TableBox>
					))}
				</tr>
			</TableBox>
		</Fragment>
	);
}

/** Two rows per prop: name, type, and default, then the description when there is one. */
export function PropRows({
	hashPrefix,
	layout,
	names,
	type,
}: {
	hashPrefix: string | undefined;
	layout: PropTableLayout;
	/** Which props to render, in order. Defaults to every key of `type`. */
	names?: ReadonlyArray<string> | undefined;
	type: Record<string, TypeNode>;
}) {
	return (names ?? Object.keys(type)).map((name) => {
		const item = type[name];
		if (item === undefined) return null;
		return <PropRow hashPrefix={hashPrefix} item={item} key={name} layout={layout} name={name} />;
	});
}

function PropRow({
	hashPrefix,
	item,
	layout,
	name,
}: {
	hashPrefix: string | undefined;
	item: TypeNode;
	layout: PropTableLayout;
	name: string;
}) {
	const {
		default: defaultValue,
		deprecated = false,
		description,
		parameters = [],
		required = false,
		returns,
		type,
		typeDescription,
		typeDescriptionLink,
	} = item;

	const hasDescription = !isEmpty(description);
	const hasDetails = hasDescription || parameters.length > 0 || returns !== undefined;
	const hasDefault = defaultValue !== undefined;
	// Generator often puts a short kind (e.g. "union") in `type` and the readable signature in
	// `typeDescription`. Prefer the signature so the type is always discoverable.
	const shownType = typeDescription ?? type;
	// The narrow layout hides a missing default, so the type cell then ends the stacked row.
	const typeEndsRow = !layout.showDefault || !hasDefault;
	const rowId = hashPrefix === undefined ? undefined : `${hashPrefix}-${name}`;
	// The description sits directly below, so the name and type hug it from the top.
	const cellBox = {
		paddingBlockEnd: hasDetails ? '0' : 'sp16',
		paddingBlockStart: 'sp16',
		paddingInline: 'sp16',
	} as const;
	const cellClassName = cx(styles.cell, styles.stackedCell);
	const ruled = hasDetails ? undefined : '';

	return (
		<Fragment>
			<tr className={styles.dataRow} id={rowId}>
				<TableBox as="th" box={cellBox} className={cellClassName} data-ruled={ruled} scope="row">
					<Cluster alignItems="baseline" flexWrap="nowrap" gap="sp4">
						<CellText
							className={styles.monospace}
							color={deprecated ? 'secondary' : 'accent'}
							fontWeight="label"
							textDecoration={deprecated ? 'line-through' : 'none'}
						>
							{name}
						</CellText>
						{layout.showRequired && required ? (
							<CellText aria-label="Required" color="secondary" role="img">
								*
							</CellText>
						) : null}
					</Cluster>
				</TableBox>
				<TableBox
					as="td"
					box={cellBox}
					className={cellClassName}
					data-row-end={typeEndsRow ? '' : undefined}
					data-ruled={ruled}
				>
					<CellText className={styles.monospace} fontWeight="body">
						{typeDescriptionLink === undefined ? (
							shownType
						) : (
							<Link appearance="text" href={typeDescriptionLink}>
								{shownType}
							</Link>
						)}
					</CellText>
				</TableBox>
				{layout.showDefault ? (
					<TableBox
						as="td"
						box={cellBox}
						className={cx(cellClassName, hasDefault ? undefined : styles.hideNarrow)}
						data-row-end=""
						data-ruled={ruled}
					>
						<CellText className={styles.narrowOnly} fontWeight="label">
							Default:{' '}
						</CellText>
						<CellText
							className={styles.monospace}
							color={hasDefault ? 'primary' : 'secondary'}
							fontWeight="body"
						>
							{hasDefault ? defaultValue : '—'}
						</CellText>
					</TableBox>
				) : null}
			</tr>
			{hasDetails ? (
				<tr>
					<TableBox
						as="td"
						box={{ paddingBlockEnd: 'sp16', paddingBlockStart: 'sp4', paddingInline: 'sp16' }}
						className={cellClassName}
						colSpan={layout.columnCount}
						data-row-end=""
						data-ruled=""
					>
						<Stack gap="sp8">
							{hasDescription ? (
								<CellText className={styles.richText} elementType="div" fontWeight="body">
									<InheritTypography>{description}</InheritTypography>
								</CellText>
							) : null}
							{parameters.length === 0 ? null : (
								<Stack gap="sp4">
									<CellText color="secondary" fontWeight="label">
										Parameters
									</CellText>
									{parameters.map((param) => (
										<CellText elementType="div" fontWeight="body" key={param.name}>
											<CellText className={styles.monospace} fontWeight="label">
												{param.name}
											</CellText>{' '}
											<InheritTypography>{param.description}</InheritTypography>
										</CellText>
									))}
								</Stack>
							)}
							{returns === undefined ? null : (
								<Stack gap="sp4">
									<CellText color="secondary" fontWeight="label">
										Returns
									</CellText>
									<CellText elementType="div" fontWeight="body">
										<InheritTypography>{returns}</InheritTypography>
									</CellText>
								</Stack>
							)}
						</Stack>
					</TableBox>
				</tr>
			) : null}
		</Fragment>
	);
}

function isEmpty(node: ReactNode): boolean {
	return node === undefined || node === null || node === '' || node === false;
}
