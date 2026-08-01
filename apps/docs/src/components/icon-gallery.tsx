/**
 * THESIS: An index, not a showcase. Refuses the icon-library marketing grid — big hero,
 * style/weight tabs, infinite scroll — because 27 first-party icons need one job done:
 * find the name, take it away.
 * OWN-WORLD: The docs' existing pill-toggle and fumadocs token language, unchanged.
 * Hairline-ruled grid, no floating cards, no shadows.
 * STORY: Scan or filter, see the glyph at the size you'll ship it at, take the name or
 * the JSX in one click.
 * FIRST VIEWPORT: Filter, size pills, live count, then the grid — the set is visible
 * without scrolling.
 * FORM: Extension of an established surface. TanStack's ruled grid, with the two copy targets
 * always present in a ruled cell footer rather than revealed on hover.
 */
import type { IconName, IconProps } from '@luke-ui/react/icon';
import { Icon, iconNames } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';
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
	const [copyState, dispatchCopy] = useReducer(copyReducer, { announcement: '', status: null });
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
			dispatchCopy({ kind, name, text: copiedText, type: 'copied' });
		} catch {
			dispatchCopy({ kind, name, text: copiedText, type: 'failed' });
		}

		copyTimeoutRef.current = window.setTimeout(() => {
			dispatchCopy({ type: 'reset' });
		}, COPY_FEEDBACK_DURATION_MS);
	}

	return (
		<div className="not-prose flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<div
					className="min-w-[12rem] flex-1 basis-56"
					ref={(node) => {
						inputRef.current = node?.querySelector('input') ?? null;
					}}
				>
					<TextField
						aria-label="Filter icons by name"
						onChange={setFilter}
						placeholder="Filter by name"
						prefix={<Icon aria-hidden name="search" size="small" />}
						size="small"
						value={filter}
					/>
				</div>
				<TextToggleButtonGroup
					label="Preview size"
					onChange={setPreviewSize}
					options={SIZE_OPTIONS}
					value={previewSize}
				/>
				<p className="ms-auto text-fd-muted-foreground text-sm tabular-nums">{countText}</p>
				<VisuallyHidden aria-live="polite" elementType="p">
					{deferredCountText}
				</VisuallyHidden>
			</div>

			<div className="overflow-hidden rounded-xl border border-fd-border">
				{filteredNames.length === 0 ? (
					<IconGalleryEmptyState onClear={handleClearFilter} query={filter.trim()} />
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
						{filteredNames.map((name) => (
							<IconGalleryCell
								copyStatus={copyState.status?.name === name ? copyState.status : null}
								key={name}
								name={name}
								onCopy={handleCopy}
								previewSize={previewSize}
							/>
						))}
					</div>
				)}
			</div>

			<VisuallyHidden aria-live="polite" elementType="p">
				{copyState.announcement}
			</VisuallyHidden>
		</div>
	);
}

interface CopyState {
	announcement: string;
	status: CopyStatus | null;
}

type CopyAction =
	| { kind: CopyKind; name: IconName; text: string; type: 'copied' }
	| { kind: CopyKind; name: IconName; text: string; type: 'failed' }
	| { type: 'reset' };

/** Drives the copy button feedback: sets status and announcement together, resets status only. */
function copyReducer(state: CopyState, action: CopyAction): CopyState {
	switch (action.type) {
		case 'copied':
			return {
				announcement: `Copied ${action.text}`,
				status: { kind: action.kind, name: action.name, state: 'copied' },
			};
		case 'failed':
			return {
				announcement: `Couldn't copy automatically. Please copy manually: ${action.text}.`,
				status: { kind: action.kind, name: action.name, state: 'error' },
			};
		case 'reset':
			return { ...state, status: null };
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
			<div className="flex flex-col items-center gap-1 p-2">
				<div className="flex h-20 w-full items-center justify-center">
					<Icon aria-hidden name={name} size={previewSize} />
				</div>
				<span className="w-full truncate text-center text-fd-muted-foreground text-xs" title={name}>
					{name}
				</span>
			</div>
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
			className={cx(COPY_BUTTON_CLASS_NAME, kind === 'jsx' && 'border-r border-fd-border')}
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
		<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
			<p className="text-fd-muted-foreground text-sm">No icon matches &quot;{query}&quot;</p>
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
		</div>
	);
}
