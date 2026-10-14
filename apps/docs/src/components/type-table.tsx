import { Cluster } from '@luke-ui/react/cluster';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ReactNode } from 'react';
import { Fragment } from 'react';
import { InheritTypography } from './docs-article/mdx-elements.js';
import * as referenceStyles from './reference-table.css.js';
import {
	CellText,
	ReferenceHeaderCell,
	ReferenceTableFrame,
	ReferenceTableHeader,
	TableBox,
} from './reference-table.js';
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
		<ReferenceTableFrame {...props} className={className} id={id}>
			<PropTableHead layout={layout} />
			<tbody className={referenceStyles.bodyGroup}>
				<PropRows hashPrefix={rowIdPrefix ?? id} layout={layout} type={type} />
			</tbody>
		</ReferenceTableFrame>
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

export function PropTableHead({ layout }: { layout: PropTableLayout }) {
	const headers = layout.showDefault ? ['Name', 'Type', 'Default'] : ['Name', 'Type'];

	return (
		<Fragment>
			<colgroup>
				<TableBox as="col" box={{ inlineSize: '30%' }} className={referenceStyles.hideNarrow} />
				<col />
				{layout.showDefault ? (
					<TableBox as="col" box={{ inlineSize: '20%' }} className={referenceStyles.hideNarrow} />
				) : null}
			</colgroup>
			<ReferenceTableHeader>
				{headers.map((header) => (
					<ReferenceHeaderCell key={header}>{header}</ReferenceHeaderCell>
				))}
			</ReferenceTableHeader>
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
	const cellClassName = cx(referenceStyles.cell, referenceStyles.stackedCell);
	const ruled = hasDetails ? undefined : '';

	return (
		<Fragment>
			<tr className={styles.dataRow} id={rowId}>
				<TableBox as="th" box={cellBox} className={cellClassName} data-ruled={ruled} scope="row">
					<Cluster alignItems="baseline" flexWrap="nowrap" gap="sp4">
						<CellText
							className={referenceStyles.monospace}
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
					<CellText className={referenceStyles.monospace} fontWeight="body">
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
						className={cx(cellClassName, hasDefault ? undefined : referenceStyles.hideNarrow)}
						data-row-end=""
						data-ruled={ruled}
					>
						<CellText className={styles.narrowOnly} fontWeight="label">
							Default:{' '}
						</CellText>
						<CellText
							className={referenceStyles.monospace}
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
											<CellText className={referenceStyles.monospace} fontWeight="label">
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
