'use client';

import { TypeTable } from 'fumadocs-ui/components/type-table';
import type { TypeNode } from 'fumadocs-ui/components/type-table';
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
		<div
			className={['my-6 flex flex-col gap-3', className].filter(Boolean).join(' ')}
			id={id}
			{...props}
		>
			{nativePropsNote !== undefined ? (
				<div className="text-fd-muted-foreground text-sm">{nativePropsNote}</div>
			) : null}
			{groups.map((group) => (
				<PropGroup
					group={group}
					id={id}
					key={group.name}
					type={pickGroupProps(type, new Set(group.props))}
				/>
			))}
		</div>
	);
}

function PropGroup({
	group,
	id,
	type,
}: {
	group: { defaultOpen: boolean; name: string; props: ReadonlyArray<string> };
	id: string;
	type: Record<string, TypeNode>;
}) {
	const headingId = `${id}-${slugify(group.name)}-heading`;
	const tableId = `${id}-${slugify(group.name)}-table`;

	return (
		<Collapsible className="rounded-2xl border bg-fd-card" defaultOpen={group.defaultOpen}>
			<h3 className="not-prose contents">
				<CollapsibleTrigger
					className="group flex w-full items-center justify-between px-4 py-3 text-start"
					id={headingId}
				>
					<span className="font-medium text-fd-foreground text-sm">{group.name}</span>
					<ChevronIcon />
				</CollapsibleTrigger>
			</h3>
			<CollapsibleContent className="border-fd-border border-t px-1 pb-1">
				<TypeTable id={tableId} type={type} />
			</CollapsibleContent>
		</Collapsible>
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

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}
