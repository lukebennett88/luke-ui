import { Box } from '@luke-ui/react/box';
import { buttonRecipe } from '@luke-ui/react/button';
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
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { Capture } from '../report/schema.js';
import * as styles from './contents.css.js';
import type { Example } from './examples.js';
import type { StatusFilter } from './review-params.js';
import { STATUS_FILTERS, STATUS_LABELS } from './review-params.js';
import { touchTarget } from './review.css.js';
import type { SeenState } from './seen-store.js';

const STATUS_ITEMS = STATUS_FILTERS.map((id) => ({
	id,
	label: id === 'all' ? 'All statuses' : STATUS_LABELS[id],
}));

type ContentsProps = {
	changedCount: number;
	currentId: string | undefined;
	examples: ReadonlyArray<Example>;
	filterRef: RefObject<HTMLInputElement | null>;
	/** Whether the report mixes changed, added and removed captures, so a status filter has a use. */
	hasStatuses: boolean;
	hideViewed: boolean;
	isCompact: boolean;
	/** Whether Contents sits in a drawer or sheet rather than beside the captures. */
	isOverlay: boolean;
	onClose: () => void;
	onHideViewed: (isHidden: boolean) => void;
	onQuery: (query: string) => void;
	onSelect: (exampleId: string) => void;
	onStatus: (status: StatusFilter) => void;
	query: string;
	stateOf: (capture: Capture) => SeenState;
	status: StatusFilter;
};

/**
 * Every example in the report, grouped by component, with each one's progress, and the filters
 * that find the work left.
 */
export function Contents(props: ContentsProps) {
	const { changedCount, currentId, examples, filterRef } = props;
	const { hasStatuses, hideViewed } = props;
	const { isCompact, isOverlay, onClose, onHideViewed } = props;
	const { onQuery, onSelect, onStatus, query, stateOf, status } = props;
	const size = isCompact ? 'medium' : 'small';
	const areKeysShown = !isCompact;

	return (
		<Box
			aria-labelledby="review-contents-title"
			display="flex"
			flexDirection="column"
			elementType="nav"
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
				{/* Progress is in the top bar. Only what it leaves out is said here. */}
				<Stack gap="space.4" minInlineSize="0">
					<Heading id="review-contents-title" level={2} typography="body">
						Contents
					</Heading>
					{changedCount > 0 ? (
						<Text color="secondary" fontVariantNumeric="tabular-nums" typography="label">
							{`${changedCount} changed since viewed`}
						</Text>
					) : null}
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
					{/* A linked status filter stays, so it can be cleared. */}
					{hasStatuses || status !== 'all' ? (
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
					) : null}
					<LockupRail>
						<CheckboxField
							isSelected={hideViewed}
							label="Hide viewed"
							onChange={onHideViewed}
							size={size}
						/>
					</LockupRail>
				</Lockup>
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
	const ref = useRef<HTMLLIElement>(null);

	// The example in view stays in sight as the page scrolls through the report.
	useEffect(() => {
		if (isCurrent) ref.current?.scrollIntoView({ block: 'nearest' });
	}, [isCurrent]);

	return (
		<li ref={ref}>
			<Lockup
				className={buttonRecipe({
					className: styles.item,
					prominence: isCurrent ? 'standard' : 'low',
					size: 'small',
				})}
				gap="space.8"
				paddingInline="space.8"
				railAlignment="center"
				renderRoot={(domProps) => {
					return (
						<AriaButton
							{...domProps}
							aria-current={isCurrent ? 'true' : undefined}
							onPress={() => onSelect(example.id)}
						/>
					);
				}}
			>
				<LockupBody renderRoot={(domProps) => <Text {...domProps} lineClamp />}>
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
