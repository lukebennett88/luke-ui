import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure';
import { groupPropNames, NATIVE_PROPS_FORWARDING_KEY } from '../lib/component-prop-groups.js';
import * as styles from './component-props-table.css.js';
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
		<Stack className={cx('not-prose', className)} gap="sp12" id={id} marginBlock="sp24" {...props}>
			{nativePropsNote === undefined ? null : (
				<Text color="secondary" elementType="div" typography="caption">
					{nativePropsNote}
				</Text>
			)}
			{groups.map((group) => (
				<PropGroup
					group={group}
					key={group.name}
					type={pickGroupProps(type, new Set(group.props))}
				/>
			))}
		</Stack>
	);
}

function PropGroup({
	group,
	type,
}: {
	group: { defaultOpen: boolean; name: string; props: ReadonlyArray<string> };
	type: Record<string, TypeNode>;
}) {
	return (
		<Box
			backgroundColor="surface.base"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			overflow="hidden"
		>
			<Disclosure defaultExpanded={group.defaultOpen}>
				<RacButton className={styles.groupTrigger} slot="trigger">
					<Cluster
						alignItems="center"
						gap="sp8"
						inlineSize="100%"
						justifyContent="space-between"
						paddingBlock="sp12"
						paddingInline="sp16"
					>
						<Text elementType="span" fontWeight="emphasis" typography="caption">
							{group.name}
						</Text>
						<Icon aria-hidden className={styles.groupChevron} name="chevronDown" size="small" />
					</Cluster>
				</RacButton>
				<DisclosurePanel>
					<Box className={styles.groupPanel} paddingBlockEnd="sp4" paddingInline="sp4">
						<TypeTable type={type} />
					</Box>
				</DisclosurePanel>
			</Disclosure>
		</Box>
	);
}

function pickGroupProps(
	type: Record<string, TypeNode>,
	names: ReadonlySet<string>,
): Record<string, TypeNode> {
	return Object.fromEntries(Object.entries(type).filter(([name]) => names.has(name)));
}
