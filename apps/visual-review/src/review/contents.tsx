import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Link } from '@luke-ui/react/link';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { Capture } from '../report/schema.js';
import * as styles from './contents.css.js';
import type { Example } from './examples.js';
import type { StatusFilter } from './review-params.js';
import { STATUS_FILTERS, STATUS_LABELS } from './review-params.js';
import { touchTarget, truncate } from './review.css.js';
import type { SeenState } from './seen-store.js';

const STATUS_ITEMS = STATUS_FILTERS.map((id) => ({
	id,
	label: id === 'all' ? 'All statuses' : STATUS_LABELS[id],
}));

type ContentsProps = {
	areShortcutsEnabled: boolean;
	changedCount: number;
	currentId: string | undefined;
	examples: ReadonlyArray<Example>;
	filterRef: RefObject<HTMLInputElement | null>;
	hideViewed: boolean;
	isCompact: boolean;
	/** Whether Contents sits in a drawer or sheet rather than beside the captures. */
	isOverlay: boolean;
	onClose: () => void;
	onHideViewed: (isHidden: boolean) => void;
	onMarkAllViewed: () => void;
	onNextUnviewed: () => void;
	onQuery: (query: string) => void;
	onSelect: (exampleId: string) => void;
	onStatus: (status: StatusFilter) => void;
	query: string;
	/** The report's title, repeated on phones where the top bar has no room for it. */
	reportTitle: ReactNode;
	stateOf: (capture: Capture) => SeenState;
	status: StatusFilter;
	total: number;
	viewed: number;
};

/**
 * Every example in the report, grouped by component, with each one's progress. It also holds the
 * filters and the report-wide actions: next unviewed and mark all viewed.
 */
export function Contents(props: ContentsProps) {
	const { areShortcutsEnabled, changedCount, currentId, examples, filterRef, hideViewed } = props;
	const { isCompact, isOverlay, onClose, onHideViewed, onMarkAllViewed, onNextUnviewed } = props;
	const { onQuery, onSelect, onStatus, query, reportTitle, stateOf, status, total, viewed } = props;
	const listRef = useRef<HTMLDivElement>(null);
	const size = isCompact ? 'medium' : 'small';
	const areKeysShown = areShortcutsEnabled && !isCompact;

	useEffect(() => {
		if (!currentId) return;
		listRef.current
			?.querySelector(`[data-id="${CSS.escape(currentId)}"]`)
			?.scrollIntoView({ block: 'nearest' });
	}, [currentId]);

	return (
		<Box
			aria-labelledby="review-contents-title"
			backgroundColor={isOverlay ? 'surface.raised' : 'surface.subdued'}
			className={cx(styles.contents, isOverlay && styles.contentsInOverlay)}
			display="flex"
			flexDirection="column"
			elementType="nav"
			id="review-contents"
		>
			<Box
				alignItems="flex-start"
				paddingBlockStart="space.16"
				paddingInlineStart="space.16"
				paddingInlineEnd="space.8"
				display="flex"
				gap="space.8"
				justifyContent="space-between"
			>
				<Stack gap="space.4" minInlineSize="0">
					<Heading id="review-contents-title" level={2} typography="body">
						Contents
					</Heading>
					<Text color="secondary" fontVariantNumeric="tabular-nums" typography="label">
						{`${viewed} of ${total} viewed`}
						{changedCount > 0 ? ` · ${changedCount} changed since viewed` : ''}
					</Text>
				</Stack>
				{isOverlay ? (
					<IconButton
						aria-label="Close contents"
						className={touchTarget}
						icon="close"
						onPress={onClose}
						prominence="low"
						size={size}
					/>
				) : null}
			</Box>
			{isCompact ? (
				<Box paddingBlockStart="space.12" paddingInline="space.16">
					<Text color="secondary" elementType="p" typography="label">
						{reportTitle}
					</Text>
				</Box>
			) : null}
			<Stack gap="space.12" paddingBlock="space.16" paddingInline="space.16">
				<TextInputField
					aria-label="Filter captures"
					inputRef={filterRef}
					onChange={onQuery}
					placeholder="Filter captures"
					prefix={<Icon name="search" size="small" />}
					size={size}
					suffix={areKeysShown ? <Kbd aria-hidden>/</Kbd> : undefined}
					type="search"
					value={query}
				/>
				<Lockup gap="space.12" railAlignment="center">
					<LockupBody>
						<SelectField
							aria-label="Status"
							items={STATUS_ITEMS}
							onChange={(value) => onStatus(STATUS_FILTERS.find((id) => id === value) ?? 'all')}
							size={size}
							value={status}
						>
							{(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
						</SelectField>
					</LockupBody>
					<LockupRail>
						<CheckboxField
							isSelected={hideViewed}
							label="Hide viewed"
							onChange={onHideViewed}
							size={size}
						/>
					</LockupRail>
				</Lockup>
				<Box
					alignItems="center"
					display="flex"
					flexWrap="wrap"
					gap="space.8"
					justifyContent="space-between"
				>
					<Box alignItems="center" display="flex" gap="space.8">
						<Button onPress={onNextUnviewed} size={size}>
							Next unviewed
						</Button>
						{areKeysShown ? <Kbd aria-hidden>u</Kbd> : null}
					</Box>
					<Button
						className={styles.pushEnd}
						isDisabled={viewed === total}
						onPress={onMarkAllViewed}
						prominence="low"
						size={size}
					>
						Mark all viewed
					</Button>
				</Box>
			</Stack>
			<Box
				className={styles.list}
				flexGrow="1"
				minBlockSize="0"
				overflowY="auto"
				overscrollBehavior="contain"
				paddingBlockEnd="space.24"
				paddingInline="space.8"
				position="relative"
				ref={listRef}
			>
				{examples.length === 0 ? (
					<Box padding="space.8" role="status">
						<Text color="secondary" typography="label">
							No captures match the filter.
						</Text>
					</Box>
				) : null}
				{groupByComponent(examples).map(([component, items]) => (
					<Stack
						aria-label={component}
						className={styles.group}
						elementType="ul"
						gap="0"
						key={component}
						marginBlockEnd="space.12"
						padding="0"
					>
						<Box aria-hidden elementType="li" paddingBlock="space.4" paddingInline="space.8">
							<Text color="secondary" fontWeight="emphasis" typography="label">
								{component}
							</Text>
						</Box>
						{items.map((example) => (
							<ContentsItem
								example={example}
								isCurrent={example.id === currentId}
								key={example.id}
								onSelect={onSelect}
								stateOf={stateOf}
							/>
						))}
					</Stack>
				))}
			</Box>
			<Box paddingBlock="space.12" paddingInline="space.16">
				<Link href={window.location.pathname}>All open pull requests</Link>
			</Box>
		</Box>
	);
}

type ContentsItemProps = {
	example: Example;
	isCurrent: boolean;
	onSelect: (exampleId: string) => void;
	stateOf: (capture: Capture) => SeenState;
};

function ContentsItem({ example, isCurrent, onSelect, stateOf }: ContentsItemProps) {
	const total = example.captures.length;
	const seen = example.captures.filter((capture) => stateOf(capture) === 'seen').length;
	const hasChanged = example.captures.some((capture) => stateOf(capture) === 'changed');
	return (
		<li>
			<Lockup
				className={styles.item}
				gap="space.8"
				paddingInline="space.8"
				railAlignment="center"
				renderRoot={(domProps) => {
					return (
						<AriaButton
							{...domProps}
							aria-current={isCurrent ? 'true' : undefined}
							data-id={example.id}
							onPress={() => onSelect(example.id)}
						/>
					);
				}}
			>
				<LockupBody className={truncate} elementType="span">
					{example.name}
					<VisuallyHidden>
						{`, ${seen} of ${total} viewed${hasChanged ? ', changed since viewed' : ''}`}
					</VisuallyHidden>
				</LockupBody>
				<LockupRail aria-hidden className={styles.itemState} elementType="span">
					{hasChanged ? <span className={styles.changedDot} /> : null}
					{seen === total ? (
						<Icon name="check" size="xsmall" />
					) : (
						<Text
							color="secondary"
							fontVariantNumeric="tabular-nums"
							typography="label"
						>{`${seen}/${total}`}</Text>
					)}
				</LockupRail>
			</Lockup>
		</li>
	);
}

function groupByComponent(examples: ReadonlyArray<Example>): Array<[string, Array<Example>]> {
	const groups = new Map<string, Array<Example>>();
	for (const example of examples) {
		const group = groups.get(example.component);
		if (group) group.push(example);
		else groups.set(example.component, [example]);
	}
	return [...groups];
}
