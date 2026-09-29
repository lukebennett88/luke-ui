'use client';

import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { TypeNode } from 'fumadocs-ui/components/type-table';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from 'fumadocs-ui/components/ui/collapsible';
import type { ComponentProps } from 'react';
import { groupPropNames, NATIVE_PROPS_FORWARDING_KEY } from '../lib/component-prop-groups.js';

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
		<Stack className={className} gap="sp12" id={id} marginBlock="sp24" {...props}>
			{nativePropsNote !== undefined ? (
				<Text color="secondary" elementType="p" typography="caption">
					{nativePropsNote}
				</Text>
			) : null}
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
			backgroundColor="surface.canvas"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			render={(props) => <Collapsible {...props} defaultOpen={group.defaultOpen} />}
		>
			<Cluster
				className="group text-start"
				flexWrap="nowrap"
				inlineSize="100%"
				justifyContent="space-between"
				paddingBlock="sp12"
				paddingInline="sp16"
				render={(props) => <CollapsibleTrigger {...props} />}
			>
				<Text elementType="span" fontWeight="emphasis" typography="caption">
					{group.name}
				</Text>
				<ChevronIcon />
			</Cluster>
			<Box
				className="border-fd-border border-t"
				paddingBlockEnd="sp4"
				paddingInline="sp4"
				render={(props) => <CollapsibleContent {...props} />}
			>
				<TypeTable type={type} />
			</Box>
		</Box>
	);
}

function ChevronIcon() {
	return (
		<svg
			aria-hidden
			className="size-4 text-fd-muted-foreground transition-transform group-data-[state=open]:rotate-180"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function pickGroupProps(
	type: Record<string, TypeNode>,
	names: ReadonlySet<string>,
): Record<string, TypeNode> {
	return Object.fromEntries(Object.entries(type).filter(([name]) => names.has(name)));
}
