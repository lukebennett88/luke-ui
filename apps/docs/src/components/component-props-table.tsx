import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { useRouterState } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { groupPropNames, NATIVE_PROPS_FORWARDING_KEY } from '../lib/component-prop-groups.js';
import * as styles from './component-props-table.css.js';
import * as tableStyles from './type-table.css.js';
import type { PropTableLayout, TypeNode } from './type-table.js';
import { getPropTableLayout, PropRows, PropTableFrame, PropTableHead } from './type-table.js';

/** Grouped prop table for a component guide's `## API` section. */
export function ComponentPropsTable({
	className,
	id,
	type,
	...props
}: {
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

	useEffect(() => {
		// Rows in a collapsed group do not exist when the browser first resolves the hash.
		if (hash.startsWith(`${id}-`))
			document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' });
	}, [hash, id]);

	return (
		<Stack className={cx('not-prose', className)} gap="sp12" id={id} marginBlock="sp24" {...props}>
			{nativePropsNote === undefined ? null : (
				<Text color="secondary" elementType="div" typography="caption">
					{nativePropsNote}
				</Text>
			)}
			<PropTableFrame>
				<PropTableHead layout={layout} />
				{groups.map((group) =>
					group.name === 'Component props' ? (
						<tbody key={group.name}>
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
			</PropTableFrame>
		</Stack>
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
		<tbody>
			<tr>
				<td
					className={cx(tableStyles.cell, styles.groupCell)}
					colSpan={layout.columnCount}
					data-row-end=""
					data-ruled=""
				>
					<RacButton
						aria-expanded={isExpanded}
						className={styles.groupButton}
						onPress={() => {
							setToggle({ atHash: hash, open: !isExpanded });
						}}
					>
						<Icon aria-hidden className={styles.groupChevron} name="chevronRight" size="xsmall" />
						{group.name}
					</RacButton>
				</td>
			</tr>
			{isExpanded ? (
				<PropRows hashPrefix={rowIdPrefix} layout={layout} names={group.props} type={type} />
			) : null}
		</tbody>
	);
}
