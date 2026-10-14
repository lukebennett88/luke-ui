import { Link } from '@luke-ui/react/link';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ReactNode } from 'react';
import { Fragment } from 'react';
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
			<tbody>
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

/** The bordered, rounded table surface and the container that drives its narrow layout. */
export function PropTableFrame({
	children,
	className,
	...props
}: { children: ReactNode } & ComponentProps<'div'>) {
	return (
		<div {...props} className={cx(styles.frame, 'not-prose', className)}>
			<table className={styles.table}>{children}</table>
		</div>
	);
}

export function PropTableHead({ layout }: { layout: PropTableLayout }) {
	return (
		<Fragment>
			<colgroup>
				<col className={styles.nameColumn} />
				<col />
				{layout.showDefault ? <col className={styles.defaultColumn} /> : null}
			</colgroup>
			<thead className={styles.head}>
				<tr>
					<th className={styles.columnHeader} scope="col">
						Name
					</th>
					<th className={styles.columnHeader} scope="col">
						Type
					</th>
					{layout.showDefault ? (
						<th className={styles.columnHeader} scope="col">
							Default
						</th>
					) : null}
				</tr>
			</thead>
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
	const cellProps = {
		'data-described': hasDetails ? '' : undefined,
		'data-ruled': hasDetails ? undefined : '',
	};

	return (
		<Fragment>
			<tr className={styles.dataRow} id={rowId}>
				<th {...cellProps} className={cx(styles.cell, styles.dataCell)} scope="row">
					<span className={cx(styles.propName, deprecated && styles.propNameDeprecated)}>
						{name}
					</span>
					{layout.showRequired && required ? (
						<span aria-label="Required" className={styles.requiredMark} role="img">
							*
						</span>
					) : null}
				</th>
				<td
					{...cellProps}
					className={cx(styles.cell, styles.dataCell, styles.propType)}
					data-row-end={typeEndsRow ? '' : undefined}
				>
					{typeDescriptionLink === undefined ? (
						shownType
					) : (
						<Link appearance="text" className={styles.propTypeLink} href={typeDescriptionLink}>
							{shownType}
						</Link>
					)}
				</td>
				{layout.showDefault ? (
					<td
						{...cellProps}
						className={cx(
							styles.cell,
							styles.dataCell,
							styles.defaultCell,
							hasDefault ? undefined : styles.emptyDefault,
						)}
						data-row-end=""
					>
						<span className={styles.defaultLabel}>Default: </span>
						{hasDefault ? defaultValue : '—'}
					</td>
				) : null}
			</tr>
			{hasDetails ? (
				<tr>
					<td
						className={cx(styles.cell, styles.descriptionCell)}
						colSpan={layout.columnCount}
						data-row-end=""
						data-ruled=""
					>
						{hasDescription ? <div>{description}</div> : null}
						{parameters.length === 0 ? null : (
							<div className={styles.metaList}>
								<span className={styles.metaLabel}>Parameters</span>
								{parameters.map((param) => (
									<div key={param.name}>
										<span className={styles.paramName}>{param.name}</span> {param.description}
									</div>
								))}
							</div>
						)}
						{returns === undefined ? null : (
							<div className={styles.metaList}>
								<span className={styles.metaLabel}>Returns</span>
								<div>{returns}</div>
							</div>
						)}
					</td>
				</tr>
			) : null}
		</Fragment>
	);
}

function isEmpty(node: ReactNode): boolean {
	return node === undefined || node === null || node === '' || node === false;
}
