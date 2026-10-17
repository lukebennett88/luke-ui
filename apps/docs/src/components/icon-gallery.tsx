import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Grid } from '@luke-ui/react/grid';
import type { IconName, IconProps } from '@luke-ui/react/icon';
import { Icon, iconNames } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { JSX, ReactNode } from 'react';
import { useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import * as styles from './icon-gallery.css.js';
import { TextToggleButtonGroup } from './playground/icon-toggle-button-group.js';
import * as referenceStyles from './reference-table.css.js';

type GalleryIconSize = NonNullable<IconProps['size']>;

const SIZE_OPTIONS = [
	{ label: 'XS', value: 'xsmall' },
	{ label: 'S', value: 'small' },
	{ label: 'M', value: 'medium' },
	{ label: 'L', value: 'large' },
] as const satisfies ReadonlyArray<{ label: string; value: GalleryIconSize }>;

/** How long a copy button shows its "Copied"/error feedback before reverting. */
const COPY_FEEDBACK_DURATION_MS = 1500;

type CopyKind = 'jsx' | 'name';

/** Which cell's copy button is mid-feedback, and whether the write succeeded. */
interface CopyStatus {
	kind: CopyKind;
	name: IconName;
	state: 'copied' | 'error';
}

/** Searchable index of the first-party icon set, sized at the token you'll ship it at. */
export function IconGallery(): JSX.Element {
	const [filter, setFilter] = useState('');
	const [previewSize, setPreviewSize] = useState<GalleryIconSize>('medium');
	const [copyState, dispatchCopy] = useReducer(copyReducer, {
		announcement: '',
		status: null,
	});
	const inputRef = useRef<HTMLInputElement | null>(null);
	const copyTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current != null) window.clearTimeout(copyTimeoutRef.current);
		};
	}, []);

	const trimmedFilter = filter.trim().toLowerCase();
	const filteredNames = useMemo(() => {
		if (trimmedFilter === '') return iconNames;
		return iconNames.filter((name) => name.toLowerCase().includes(trimmedFilter));
	}, [trimmedFilter]);

	const countText =
		trimmedFilter === ''
			? `${iconNames.length} icons`
			: `${filteredNames.length} of ${iconNames.length}`;

	/** Deferred so a screen reader hears the settled result, not every keystroke. */
	const deferredCountText = useDeferredValue(countText);

	function handleClearFilter() {
		setFilter('');
		inputRef.current?.focus();
	}

	async function handleCopy(name: IconName, kind: CopyKind) {
		const copiedText = kind === 'jsx' ? `<Icon name="${name}" />` : name;

		if (copyTimeoutRef.current != null) window.clearTimeout(copyTimeoutRef.current);

		try {
			await navigator.clipboard.writeText(copiedText);
			dispatchCopy({
				kind,
				name,
				text: copiedText,
				type: 'copied',
			});
		} catch {
			dispatchCopy({
				kind,
				name,
				text: copiedText,
				type: 'failed',
			});
		}

		copyTimeoutRef.current = window.setTimeout(() => {
			dispatchCopy({
				type: 'reset',
			});
		}, COPY_FEEDBACK_DURATION_MS);
	}

	return (
		<Stack className="not-prose" gap="sp16">
			<Lockup className={referenceStyles.filterToolbarCaption} gap="sp12" railAlignment="center">
				<LockupBody>
					<Cluster gap="sp12">
						<Box flexBasis="14rem" flexGrow="1" minInlineSize="12rem">
							<TextInputField
								aria-label="Filter icons by name"
								inputRef={inputRef}
								onChange={setFilter}
								placeholder="Filter by name"
								prefix={<Icon name="search" size="small" />}
								size="small"
								value={filter}
							/>
						</Box>
						<TextToggleButtonGroup
							label="Preview size"
							onChange={setPreviewSize}
							options={SIZE_OPTIONS}
							value={previewSize}
						/>
					</Cluster>
				</LockupBody>
				<LockupRail>
					<Text color="secondary" fontVariantNumeric="tabular-nums" typography="caption">
						{countText}
					</Text>
					<VisuallyHidden aria-live="polite" elementType="p">
						{deferredCountText}
					</VisuallyHidden>
				</LockupRail>
			</Lockup>

			{filteredNames.length === 0 ? (
				<IconGalleryEmptyState onClear={handleClearFilter} query={filter.trim()} />
			) : (
				<Box
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					overflow="hidden"
				>
					<Grid columns="repeat(auto-fit, minmax(min(8rem, 100%), 1fr))">
						{filteredNames.map((name) => (
							<IconGalleryCell
								copyStatus={copyState.status?.name === name ? copyState.status : null}
								key={name}
								name={name}
								onCopy={handleCopy}
								previewSize={previewSize}
							/>
						))}
					</Grid>
				</Box>
			)}

			<VisuallyHidden aria-live="polite" elementType="p">
				{copyState.announcement}
			</VisuallyHidden>
		</Stack>
	);
}

interface CopyState {
	announcement: string;
	status: CopyStatus | null;
}

type CopyAction =
	| {
			kind: CopyKind;
			name: IconName;
			text: string;
			type: 'copied';
	  }
	| {
			kind: CopyKind;
			name: IconName;
			text: string;
			type: 'failed';
	  }
	| {
			type: 'reset';
	  };

/** Drives the copy button feedback: sets status and announcement together, resets status only. */
function copyReducer(state: CopyState, action: CopyAction): CopyState {
	switch (action.type) {
		case 'copied':
			return {
				announcement: `Copied ${action.text}`,
				status: {
					kind: action.kind,
					name: action.name,
					state: 'copied',
				},
			};
		case 'failed':
			return {
				announcement: `Couldn't copy automatically. Please copy manually: ${action.text}.`,
				status: {
					kind: action.kind,
					name: action.name,
					state: 'error',
				},
			};
		case 'reset':
			return {
				...state,
				status: null,
			};
	}
}

interface IconGalleryCellProps {
	copyStatus: CopyStatus | null;
	name: IconName;
	onCopy: (name: IconName, kind: CopyKind) => void;
	previewSize: GalleryIconSize;
}

/** One grid cell: a fixed-height glyph area, the name below it, and a ruled footer of two copy buttons. */
function IconGalleryCell({ copyStatus, name, onCopy, previewSize }: IconGalleryCellProps) {
	return (
		<Stack className={styles.cell} gap="0">
			<Stack alignItems="center" gap="sp4" padding="sp8">
				<Box
					alignItems="center"
					blockSize="5rem"
					display="flex"
					inlineSize="100%"
					justifyContent="center"
				>
					<Icon name={name} size={previewSize} />
				</Box>
				<Box inlineSize="100%">
					<Text
						color="secondary"
						lineClamp={1}
						textAlign="center"
						title={name}
						typography="caption"
					>
						{name}
					</Text>
				</Box>
			</Stack>
			<Grid className={styles.copyRow} columns="1fr 1fr">
				<CopyButton
					copyStatus={copyStatus?.kind === 'jsx' ? copyStatus : null}
					kind="jsx"
					name={name}
					onCopy={onCopy}
				/>
				<CopyButton
					copyStatus={copyStatus?.kind === 'name' ? copyStatus : null}
					kind="name"
					name={name}
					onCopy={onCopy}
				/>
			</Grid>
		</Stack>
	);
}

interface CopyButtonProps {
	copyStatus: CopyStatus | null;
	kind: CopyKind;
	name: IconName;
	onCopy: (name: IconName, kind: CopyKind) => void;
}

/** One half of the ruled footer's copy control. The `jsx` button renders first, so it carries the divider. */
function CopyButton({ copyStatus, kind, name, onCopy }: CopyButtonProps) {
	const accessibleLabel = kind === 'jsx' ? `Copy JSX for ${name}` : `Copy name ${name}`;

	const label: ReactNode = (() => {
		const copyStatusState = copyStatus?.state;
		if (copyStatusState === 'copied') return 'Copied';
		if (copyStatusState === 'error') return 'Failed';
		if (kind === 'jsx') return 'JSX';

		return 'Name';
	})();

	return (
		<Box
			alignItems="center"
			className={cx(styles.copyButton, kind === 'jsx' && styles.copyButtonDivider)}
			display="flex"
			gap="sp4"
			justifyContent="center"
			minBlockSize={vars.space.sp32}
			minInlineSize="0"
			padding="0"
			renderRoot={(domProps) => (
				<RacButton
					{...domProps}
					aria-label={accessibleLabel}
					onPress={() => {
						onCopy(name, kind);
					}}
				/>
			)}
		>
			<Text fontWeight="label" typography="caption">
				{label}
			</Text>
		</Box>
	);
}

interface IconGalleryEmptyStateProps {
	onClear: () => void;
	query: string;
}

/** Real empty state inside the grid frame: names the query, offers a way back. */
function IconGalleryEmptyState({ onClear, query }: IconGalleryEmptyStateProps) {
	return (
		<Stack alignItems="center" gap="sp12" paddingBlock="sp48" paddingInline="sp24">
			<Text color="secondary" elementType="p" textAlign="center" typography="caption">
				No icon matches &quot;{query}&quot;
			</Text>
			<Button onPress={onClear} size="small">
				Clear filter
			</Button>
		</Stack>
	);
}
