import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { cx } from '@luke-ui/react/utils';
import { useRouterState } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { groupPropNames, NATIVE_PROPS_FORWARDING_KEY } from '../lib/component-prop-groups.js';
import type { TypeDefinitionsPayload } from '../lib/type-definition-model.js';
import * as styles from './component-props-table.css.js';
import { InheritTypography } from './docs-article/mdx-elements.js';
import * as disclosureStyles from './docs-disclosure.css.js';
import * as tableStyles from './reference-table.css.js';
import { CellText, ReferenceTableFrame, TableCell } from './reference-table.js';
import type { PropTableLayout, TypeNode } from './type-table.js';
import {
	getPropTableLayout,
	PropRows,
	PropTableHead,
	TypeDefinitionsProvider,
} from './type-table.js';

/** Grouped prop table for a component guide's `## API` section. */
export function ComponentPropsTable({
	className,
	definitionNames,
	definitions,
	definitionsHref,
	id,
	type,
	...props
}: {
	/**
	 * Build-time alias names present in the deferred asset. Comma-separated when emitted from MDX.
	 */
	definitionNames?: string | ReadonlyArray<string>;
	/** Sync definitions for tests; production pages pass `definitionsHref` instead. */
	definitions?: TypeDefinitionsPayload;
	/** Page-level JSON asset written at MDX compile time. */
	definitionsHref?: string;
	id: string;
	type: Record<string, TypeNode>;
} & ComponentProps<'div'>) {
	const groups = groupPropNames(Object.keys(type));
	const nativePropsNote = type[NATIVE_PROPS_FORWARDING_KEY]?.description;
	const hash = useRouterState({ select: (state) => state.location.hash });
	// The marker entry is not a row, so it must not count towards the table-wide decisions.
	const layout = getPropTableLayout(
		groups.flatMap((group) => group.props.flatMap((name) => type[name] ?? [])),
	);
	const resolvedDefinitionNames =
		definitionNames === undefined
			? undefined
			: typeof definitionNames === 'string'
				? definitionNames.split(',').filter((name) => name.length > 0)
				: definitionNames;

	useEffect(() => {
		// Rows in a collapsed group do not exist when the browser first resolves the hash.
		if (hash.startsWith(`${id}-`))
			document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' });
	}, [hash, id]);

	return (
		<TypeDefinitionsProvider
			definitionNames={resolvedDefinitionNames}
			definitions={definitions}
			definitionsHref={definitionsHref}
		>
			<Stack
				className={cx('not-prose', className)}
				gap="sp16"
				id={id}
				marginBlock="sp24"
				{...props}
			>
				{nativePropsNote === undefined ? null : (
					<CellText color="secondary" elementType="div" fontWeight="body">
						<InheritTypography>{nativePropsNote}</InheritTypography>
					</CellText>
				)}
				<ReferenceTableFrame>
					<PropTableHead layout={layout} />
					{groups.map((group) =>
						group.name === 'Component props' ? (
							<tbody className={tableStyles.bodyGroup} key={group.name}>
								<PropRows hashPrefix={id} layout={layout} names={group.props} type={type} />
							</tbody>
						) : (
							<PropGroup
								group={group}
								hash={hash}
								key={group.name}
								layout={layout}
								rowIdPrefix={id}
								type={type}
							/>
						),
					)}
				</ReferenceTableFrame>
			</Stack>
		</TypeDefinitionsProvider>
	);
}

function PropGroup({
	group,
	hash,
	layout,
	rowIdPrefix,
	type,
}: {
	group: { defaultOpen: boolean; name: string; props: ReadonlyArray<string> };
	hash: string;
	layout: PropTableLayout;
	rowIdPrefix: string;
	type: Record<string, TypeNode>;
}) {
	// A reader's toggle holds until the hash changes, so a link to a prop in a collapsed group
	// always reopens it.
	const [toggle, setToggle] = useState<{ atHash: string; open: boolean } | null>(null);
	const holdsHash = group.props.some((name) => `${rowIdPrefix}-${name}` === hash);
	const isExpanded =
		toggle !== null && toggle.atHash === hash ? toggle.open : group.defaultOpen || holdsHash;

	return (
		<tbody className={tableStyles.bodyGroup}>
			<tr>
				<TableCell
					className={cx(tableStyles.cell, tableStyles.ruled, tableStyles.rowEnd)}
					colSpan={layout.columnCount}
					padding="0"
				>
					<Cluster
						className={cx(disclosureStyles.trigger, styles.groupButtonExpanded)}
						flexWrap="nowrap"
						gap="sp4"
						inlineSize="100%"
						paddingBlock="sp12"
						paddingInline="sp16"
						renderRoot={(domProps) => (
							<RacButton
								{...domProps}
								aria-expanded={isExpanded}
								onPress={() => {
									setToggle({ atHash: hash, open: !isExpanded });
								}}
							/>
						)}
					>
						<Icon
							aria-hidden
							className={disclosureStyles.chevronEnd}
							name="chevronRight"
							size="xsmall"
						/>
						<CellText fontWeight="emphasis">{group.name}</CellText>
					</Cluster>
				</TableCell>
			</tr>
			{isExpanded ? (
				<PropRows hashPrefix={rowIdPrefix} layout={layout} names={group.props} type={type} />
			) : null}
		</tbody>
	);
}
