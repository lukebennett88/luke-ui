import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
import { groupPropNames, NATIVE_PROPS_FORWARDING_KEY } from '../lib/component-prop-groups.js';
import * as styles from './component-props-table.css.js';
import * as disclosureStyles from './docs-disclosure.css.js';
import type { TypeNode } from './type-table.js';
import { TypeTable } from './type-table.js';

/** Grouped prop tables for a component guide's `## API` section. */
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

	return (
		<Stack className={cx('not-prose', className)} gap="sp8" id={id} marginBlock="sp24" {...props}>
			{nativePropsNote === undefined ? null : (
				<Text color="secondary" elementType="div" typography="caption">
					{nativePropsNote}
				</Text>
			)}
			{groups.map((group) => (
				<PropGroup
					group={group}
					key={group.name}
					rowIdPrefix={id}
					type={pickGroupProps(type, new Set(group.props))}
				/>
			))}
		</Stack>
	);
}

function PropGroup({
	group,
	rowIdPrefix,
	type,
}: {
	group: { defaultOpen: boolean; name: string; props: ReadonlyArray<string> };
	rowIdPrefix: string;
	type: Record<string, TypeNode>;
}) {
	return (
		<Box
			className={styles.group}
			renderRoot={(domProps) => <Disclosure {...domProps} defaultExpanded={group.defaultOpen} />}
		>
			<Box
				className={disclosureStyles.trigger}
				inlineSize="100%"
				paddingBlock="sp8"
				paddingInline="sp4"
				renderRoot={(domProps) => <RacButton {...domProps} slot="trigger" />}
			>
				<Track
					gap="sp8"
					railAlignment="firstLine"
					railEnd={
						<Icon
							aria-hidden
							className={disclosureStyles.chevronDown}
							name="chevronDown"
							size="xsmall"
						/>
					}
				>
					<Text fontWeight="emphasis" typography="caption">
						{group.name}
					</Text>
				</Track>
			</Box>
			<DisclosurePanel>
				<TypeTable rowIdPrefix={rowIdPrefix} type={type} />
			</DisclosurePanel>
		</Box>
	);
}

function pickGroupProps(
	type: Record<string, TypeNode>,
	names: ReadonlySet<string>,
): Record<string, TypeNode> {
	return Object.fromEntries(Object.entries(type).filter(([name]) => names.has(name)));
}
