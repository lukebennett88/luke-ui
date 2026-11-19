import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Link } from '@luke-ui/react/link';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
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
			backgroundColor={isOverlay && isCompact ? 'surface.raised' : 'surface.subdued'}
			className={cx(styles.contents, isOverlay && styles.contentsInOverlay)}
			elementType="nav"
			id="review-contents"
		>
			<div className={styles.head}>
				<div>
					<h2 className={styles.title} id="review-contents-title">
						Contents
					</h2>
					<p className={styles.summary}>
						{`${viewed} of ${total} viewed`}
						{changedCount > 0 ? ` · ${changedCount} changed since viewed` : ''}
					</p>
				</div>
				<IconButton
					aria-label="Close contents"
					className={touchTarget}
					icon="close"
					onPress={onClose}
					prominence="low"
					size={size}
				/>
			</div>
			{isCompact ? <p className={cx(styles.summary, styles.filters)}>{reportTitle}</p> : null}
			<div className={styles.filters}>
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
				<div className={styles.filterRow}>
					<SelectField
						aria-label="Status"
						className={styles.filterGrow}
						items={STATUS_ITEMS}
						onChange={(value) => onStatus(STATUS_FILTERS.find((id) => id === value) ?? 'all')}
						size={size}
						value={status}
					>
						{(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
					</SelectField>
					<CheckboxField
						isSelected={hideViewed}
						label="Hide viewed"
						onChange={onHideViewed}
						size={size}
					/>
				</div>
				<div className={styles.filterRow}>
					<Button onPress={onNextUnviewed} size={size}>
						Next unviewed
					</Button>
					{areKeysShown ? <Kbd aria-hidden>u</Kbd> : null}
					<Button
						className={styles.pushEnd}
						isDisabled={viewed === total}
						onPress={onMarkAllViewed}
						prominence="low"
						size={size}
					>
						Mark all viewed
					</Button>
				</div>
			</div>
			<div className={styles.list} ref={listRef}>
				{examples.length === 0 ? (
					<p className={styles.groupHeading} role="status">
						No captures match the filter.
					</p>
				) : null}
				{groupByComponent(examples).map(([component, items]) => (
					<ul aria-label={component} className={styles.group} key={component}>
						<li aria-hidden className={styles.groupHeading}>
							{component}
						</li>
						{items.map((example) => (
							<ContentsItem
								example={example}
								isCurrent={example.id === currentId}
								key={example.id}
								onSelect={onSelect}
								stateOf={stateOf}
							/>
						))}
					</ul>
				))}
			</div>
			<div className={styles.foot}>
				<Link href={window.location.pathname}>All open pull requests</Link>
			</div>
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
			<AriaButton
				aria-current={isCurrent ? 'true' : undefined}
				className={styles.item}
				data-id={example.id}
				onPress={() => onSelect(example.id)}
			>
				<span className={truncate}>{example.name}</span>
				<span aria-hidden className={styles.itemState}>
					{hasChanged ? <span className={styles.changedDot} /> : null}
					{seen === total ? <Icon name="check" size="xsmall" /> : <span>{`${seen}/${total}`}</span>}
				</span>
				<VisuallyHidden>
					{`, ${seen} of ${total} viewed${hasChanged ? ', changed since viewed' : ''}`}
				</VisuallyHidden>
			</AriaButton>
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
