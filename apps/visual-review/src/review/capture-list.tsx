import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { hrefWithParams } from '../navigation/location.js';
import { StateLink } from '../navigation/state-link.js';
import type { Capture, CaptureStatus } from '../report/schema.js';
import type { ReviewParams, StatusFilter } from './review-params.js';
import { STATUS_FILTERS, STATUS_LABELS } from './review-params.js';
import * as styles from './review.css.js';

const STATUS_COLORS = {
	added: 'success',
	changed: 'warning',
	removed: 'danger',
} as const satisfies Record<CaptureStatus, string>;

const SHORTCUTS = [
	{ keys: ['j', 'k'], label: 'Next, previous' },
	{ keys: ['1', '2', '3'], label: 'View' },
	{ keys: ['f'], label: 'Flip overlay' },
	{ keys: ['h'], label: 'Outlines' },
	{ keys: ['+', '-', '0'], label: 'Zoom' },
	{ keys: ['/'], label: 'Filter' },
] as const;

type CaptureListProps = {
	/** Every differing capture, before filtering. Counts in the status filter come from here. */
	allCaptures: ReadonlyArray<Capture>;
	captures: ReadonlyArray<Capture>;
	filterRef: RefObject<HTMLDivElement | null>;
	onParamsChange: (updates: Record<string, string | undefined>) => void;
	params: ReviewParams;
	search: string;
	selectedId: string | undefined;
};

export function CaptureList(props: CaptureListProps) {
	const { allCaptures, captures, filterRef, onParamsChange, params, search, selectedId } = props;
	const scrollRef = useRef<HTMLDivElement>(null);

	// Keyboard stepping can select a capture outside the scrolled region.
	useEffect(() => {
		scrollRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
	}, [selectedId]);

	const statusItems = STATUS_FILTERS.map((status) => ({
		id: status,
		label: `${statusFilterLabel(status)} (${countStatus(allCaptures, status)})`,
	}));

	return (
		<aside aria-label="Capture filters and list" className={styles.sidebar}>
			<Stack className={styles.sidebarSection} gap="space.12">
				<div ref={filterRef}>
					<TextInputField
						aria-label="Filter captures"
						onChange={(query) => onParamsChange({ q: query })}
						placeholder="Filter captures"
						prefix={<Icon name="search" size="small" />}
						size="small"
						type="search"
						value={params.query}
					/>
				</div>
				<SelectField
					aria-label="Status"
					items={statusItems}
					onChange={(status) =>
						onParamsChange({ status: status === 'all' ? undefined : String(status) })
					}
					size="small"
					value={params.status}
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
			</Stack>
			<nav aria-label="Captures" className={styles.captureScroll} ref={scrollRef}>
				{captures.length === 0 ? (
					<Text
						className={styles.captureGroupHeading}
						color="secondary"
						elementType="p"
						role="status"
					>
						No captures match the filter.
					</Text>
				) : (
					groupByComponent(captures).map(([component, group]) => (
						<section aria-label={component} key={component}>
							<Text
								className={styles.captureGroupHeading}
								color="secondary"
								elementType="h2"
								fontWeight="label"
								typography="label"
							>
								{component}
							</Text>
							<ul className={styles.captureGroup}>
								{group.map((capture) => (
									<li key={capture.id}>
										<StateLink
											aria-current={capture.id === selectedId ? 'true' : undefined}
											className={styles.captureLink}
											href={hrefWithParams(search, { capture: capture.id })}
										>
											<Text lineClamp shouldInheritFont typography="label">
												{capture.name}
											</Text>
											<Text
												className={styles.captureStatus}
												color={STATUS_COLORS[capture.status]}
												typography="caption"
											>
												{STATUS_LABELS[capture.status]}
											</Text>
										</StateLink>
									</li>
								))}
							</ul>
						</section>
					))
				)}
			</nav>
			<div className={styles.shortcuts}>
				{SHORTCUTS.map((shortcut) => (
					<Text color="secondary" key={shortcut.label} typography="caption">
						{shortcut.keys.map((key) => (
							<Kbd key={key}>{key}</Kbd>
						))}{' '}
						{shortcut.label}
					</Text>
				))}
			</div>
		</aside>
	);
}

function statusFilterLabel(status: StatusFilter) {
	return status === 'all' ? 'All differences' : STATUS_LABELS[status];
}

function countStatus(captures: ReadonlyArray<Capture>, status: StatusFilter) {
	if (status === 'all') return captures.length;
	return captures.filter((capture) => capture.status === status).length;
}

function groupByComponent(captures: ReadonlyArray<Capture>): Array<[string, Array<Capture>]> {
	const groups = new Map<string, Array<Capture>>();
	for (const capture of captures) {
		const group = groups.get(capture.component);
		if (group) group.push(capture);
		else groups.set(capture.component, [capture]);
	}
	return [...groups];
}
