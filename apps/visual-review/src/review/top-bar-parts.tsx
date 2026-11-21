import { createIcon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import type { DiffRegion } from './diff-regions.js';
import * as overlayStyles from './overlays.css.js';
import * as styles from './review.css.js';

export const SidebarIcon = createIcon({
	path: (
		<path
			d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75ZM9 4.5v15"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={1.5}
		/>
	),
});

const MoreIcon = createIcon({
	path: (
		<>
			<circle cx="3.5" cy="8" fill="currentColor" r="1.25" />
			<circle cx="8" cy="8" fill="currentColor" r="1.25" />
			<circle cx="12.5" cy="8" fill="currentColor" r="1.25" />
		</>
	),
	viewBox: '0 0 16 16',
});

export function Progress({
	isCompact,
	total,
	viewed,
}: {
	isCompact: boolean;
	total: number;
	viewed: number;
}) {
	if (isCompact) {
		return (
			<span className={styles.progress}>
				{`${viewed}/${total}`}
				<VisuallyHidden> viewed</VisuallyHidden>
			</span>
		);
	}
	return <span className={styles.progress}>{`${viewed} of ${total} viewed`}</span>;
}

type DiffStepperProps = {
	active: number | undefined;
	isCompact: boolean;
	onStep: (offset: number) => void;
	regions: ReadonlyArray<DiffRegion>;
};

/** Steps the page through the differences in the capture in view. */
export function DiffStepper({ active, isCompact, onStep, regions }: DiffStepperProps) {
	const count = regions.length;
	const position =
		active === undefined
			? `${count} difference${count === 1 ? '' : 's'}`
			: `${active + 1} of ${count}`;
	const size = isCompact ? 'medium' : 'small';
	return (
		<div
			aria-label="Differences in the capture in view"
			className={styles.differences}
			role="group"
		>
			<IconButton
				aria-label={isCompact ? 'Previous difference' : 'Previous difference (Shift D)'}
				className={styles.touchTarget}
				icon="chevronUp"
				onPress={() => onStep(-1)}
				prominence="low"
				size={size}
			/>
			<span aria-live={isCompact ? undefined : 'polite'} className={styles.differencesPosition}>
				{position}
			</span>
			<IconButton
				aria-label={isCompact ? 'Next difference' : 'Next difference (D)'}
				className={styles.touchTarget}
				icon="chevronDown"
				onPress={() => onStep(1)}
				prominence="low"
				size={size}
			/>
		</div>
	);
}

type CaptureMenuProps = {
	count: number;
	isAllViewed: boolean;
	name: string;
	onCollapse: () => void;
	onCopyLink: () => void;
	onMarkAllViewed: () => void;
};

/** Actions for the capture in view. */
export function CaptureMenu(props: CaptureMenuProps) {
	const { count, isAllViewed, name, onCollapse, onCopyLink, onMarkAllViewed } = props;
	return (
		<MenuTrigger>
			<IconButton
				aria-label={`More for ${name}`}
				icon={<MoreIcon />}
				prominence="low"
				size="small"
			/>
			<Popover className={overlayStyles.popover} offset={8} placement="bottom end">
				<Menu
					aria-label={`${name} actions`}
					className={overlayStyles.menu}
					disabledKeys={isAllViewed ? ['all'] : []}
					onAction={(key) => {
						if (key === 'all') onMarkAllViewed();
						if (key === 'link') onCopyLink();
						if (key === 'collapse') onCollapse();
					}}
				>
					{count > 1 ? (
						<MenuItem className={overlayStyles.menuItem} id="all">
							{`Mark all ${count} themes viewed`}
						</MenuItem>
					) : null}
					<MenuItem className={overlayStyles.menuItem} id="link">
						Copy link to this capture
					</MenuItem>
					<MenuItem className={overlayStyles.menuItem} id="collapse">
						{`Collapse ${name}`}
					</MenuItem>
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}
