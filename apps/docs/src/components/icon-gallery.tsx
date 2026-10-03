import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Grid } from '@luke-ui/react/grid';
import type { IconName, IconProps } from '@luke-ui/react/icon';
import { Icon, iconNames } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { JSX, ReactNode } from 'react';
import { useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { TextToggleButtonGroup } from './playground/icon-toggle-button-group.js';

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

/**
 * Shared treatment for the two per-cell copy buttons. Always visible, on every input method,
 * as part of the cell's ruled footer. The only state change is a tint on hover/focus-visible.
 */
const COPY_BUTTON_CLASS_NAME = cx(
	'flex h-7 min-w-0 items-center justify-center gap-1 whitespace-nowrap',
	'font-medium text-[11px] text-fd-muted-foreground',
	'hover:bg-fd-accent hover:text-fd-accent-foreground',
	'focus-visible:bg-fd-accent focus-visible:text-fd-accent-foreground',
	'transition-colors duration-150 motion-reduce:transition-none',
);

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
				<Text
					className="ms-auto"
					color="secondary"
					elementType="p"
					fontVariantNumeric="tabular-nums"
					typography="caption"
				>
					{countText}
				</Text>
				<VisuallyHidden aria-live="polite" elementType="p">
					{deferredCountText}
				</VisuallyHidden>
			</Cluster>

			<div className="overflow-hidden rounded-xl border border-fd-border">
				{filteredNames.length === 0 ? (
					<IconGalleryEmptyState onClear={handleClearFilter} query={filter.trim()} />
				) : (
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
				)}
			</div>

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
		<div className="-mr-px -mb-px flex flex-col border-fd-border border-r border-b">
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
				<Text
					className="w-full"
					color="secondary"
					elementType="span"
					lineClamp={1}
					textAlign="center"
					title={name}
					typography="caption"
				>
					{name}
				</Text>
			</Stack>
			<div className="grid grid-cols-2 border-fd-border border-t">
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
			</div>
		</div>
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
		<button
			aria-label={accessibleLabel}
			className={cx(COPY_BUTTON_CLASS_NAME, kind === 'jsx' && 'border-fd-border border-r')}
			onClick={() => onCopy(name, kind)}
			type="button"
		>
			{label}
		</button>
	);
}

interface IconGalleryEmptyStateProps {
	onClear: () => void;
	query: string;
}

/** Real empty state inside the grid frame: names the query, offers a way back. */
function IconGalleryEmptyState({ onClear, query }: IconGalleryEmptyStateProps) {
	return (
		<Stack
			alignItems="center"
			className="text-center"
			gap="sp12"
			paddingBlock="sp64"
			paddingInline="sp24"
		>
			<Text color="secondary" elementType="p" typography="caption">
				No icon matches &quot;{query}&quot;
			</Text>
			<button
				className={cx(
					'rounded-md border border-fd-border px-3 py-1.5 font-medium text-fd-foreground text-sm',
					'hover:bg-fd-accent hover:text-fd-accent-foreground',
				)}
				onClick={onClear}
				type="button"
			>
				Clear filter
			</button>
		</Stack>
	);
}
