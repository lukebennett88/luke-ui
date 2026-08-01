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
 * FORM: Extension of an established surface. Heroicons' split-tile copy, TanStack's
 * ruled grid.
 */
import type { IconName } from '@luke-ui/react/icon';
import { Icon, iconNames } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TextToggleButtonGroup } from './playground/icon-toggle-button-group.js';

type GalleryIconSize = 'large' | 'medium' | 'small' | 'xsmall';

const SIZE_OPTIONS = [
	{ label: 'XS', value: 'xsmall' },
	{ label: 'S', value: 'small' },
	{ label: 'M', value: 'medium' },
	{ label: 'L', value: 'large' },
] as const satisfies ReadonlyArray<{ label: string; value: GalleryIconSize }>;

/** How long a copy button shows its "Copied"/error feedback before reverting. */
const COPY_FEEDBACK_DURATION_MS = 1500;

/** How long to wait after the last keystroke before announcing the settled filter count. */
const COUNT_ANNOUNCEMENT_DEBOUNCE_MS = 300;

type CopyKind = 'jsx' | 'name';

/** Which cell's copy button is mid-feedback, and whether the write succeeded. */
interface CopyStatus {
	kind: CopyKind;
	name: IconName;
	state: 'copied' | 'error';
}

/** Fixed height of each cell's glyph area. The preview size scales inside it, not the cell itself. */
const GLYPH_AREA_CLASS_NAME = 'relative flex h-28 w-full items-center justify-center';

/**
 * Shared treatment for the two per-cell copy buttons. Hidden state is `opacity-0` plus
 * `pointer-events-none` so the buttons stay real, tab-reachable, but inert until revealed.
 * Permanently revealed on coarse-pointer (touch) devices, which have no hover state.
 */
const COPY_BUTTON_CLASS_NAME = cx(
	'absolute inset-x-1 flex h-7 items-center justify-center gap-1 whitespace-nowrap rounded-md',
	'font-medium text-[11px] text-fd-muted-foreground',
	'bg-fd-background ring-1 ring-fd-border',
	'pointer-events-none opacity-0',
	'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
	'group-hover:pointer-events-auto group-hover:opacity-100',
	'pointer-coarse:pointer-events-auto pointer-coarse:opacity-100',
	'transition-opacity duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
	'focus-visible:pointer-events-auto focus-visible:opacity-100',
);

/** Searchable index of the first-party icon set, sized at the token you'll ship it at. */
export function IconGallery(): JSX.Element {
	const [filter, setFilter] = useState('');
	const [previewSize, setPreviewSize] = useState<GalleryIconSize>('medium');
	const [copyStatus, setCopyStatus] = useState<CopyStatus | null>(null);
	const [announcement, setAnnouncement] = useState('');
	const filterFieldRef = useRef<HTMLDivElement>(null);
	const copyTimeoutRef = useRef<number | null>(null);
	const countAnnounceTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current != null) window.clearTimeout(copyTimeoutRef.current);
			if (countAnnounceTimeoutRef.current != null)
				window.clearTimeout(countAnnounceTimeoutRef.current);
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

	/** Announced count, debounced so a screen reader hears the settled result, not every keystroke. */
	const [announcedCountText, setAnnouncedCountText] = useState(countText);

	useEffect(() => {
		if (countAnnounceTimeoutRef.current != null)
			window.clearTimeout(countAnnounceTimeoutRef.current);
		countAnnounceTimeoutRef.current = window.setTimeout(() => {
			setAnnouncedCountText(countText);
		}, COUNT_ANNOUNCEMENT_DEBOUNCE_MS);
	}, [countText]);

	function handleClearFilter() {
		setFilter('');
		filterFieldRef.current?.querySelector('input')?.focus();
	}

	async function handleCopy(name: IconName, kind: CopyKind) {
		const copiedText = kind === 'jsx' ? `<Icon name="${name}" />` : name;

		if (copyTimeoutRef.current != null) window.clearTimeout(copyTimeoutRef.current);

		try {
			await navigator.clipboard.writeText(copiedText);
			setCopyStatus({ kind, name, state: 'copied' });
			setAnnouncement(`Copied ${copiedText}`);
		} catch {
			setCopyStatus({ kind, name, state: 'error' });
			setAnnouncement(`Couldn't copy automatically. Please copy manually: ${copiedText}.`);
		}

		copyTimeoutRef.current = window.setTimeout(() => {
			setCopyStatus(null);
		}, COPY_FEEDBACK_DURATION_MS);
	}

	return (
		<div className="not-prose flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-[12rem] flex-1 basis-56" ref={filterFieldRef}>
					<TextField
						adornmentStart={<Icon aria-hidden name="search" size="small" />}
						aria-label="Filter icons by name"
						onChange={setFilter}
						placeholder="Filter by name"
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
					{announcedCountText}
				</VisuallyHidden>
			</div>

			<div className="overflow-hidden rounded-xl border border-fd-border">
				{filteredNames.length === 0 ? (
					<IconGalleryEmptyState onClear={handleClearFilter} query={filter.trim()} />
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
						{filteredNames.map((name) => (
							<IconGalleryCell
								copyStatus={copyStatus?.name === name ? copyStatus : null}
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
				{announcement}
			</VisuallyHidden>
		</div>
	);
}

interface IconGalleryCellProps {
	copyStatus: CopyStatus | null;
	name: IconName;
	onCopy: (name: IconName, kind: CopyKind) => void;
	previewSize: GalleryIconSize;
}

/** One grid cell: a fixed-height glyph area, the name below it, and two hover-revealed copy buttons. */
function IconGalleryCell({ copyStatus, name, onCopy, previewSize }: IconGalleryCellProps) {
	return (
		<div className="group relative -mr-px -mb-px flex flex-col items-center gap-1 border-fd-border border-r border-b p-2">
			<div className={GLYPH_AREA_CLASS_NAME}>
				<Icon aria-hidden name={name} size={previewSize} />
				<CopyButton
					copyStatus={copyStatus?.kind === 'jsx' ? copyStatus : null}
					kind="jsx"
					name={name}
					onCopy={onCopy}
					position="top"
				/>
				<CopyButton
					copyStatus={copyStatus?.kind === 'name' ? copyStatus : null}
					kind="name"
					name={name}
					onCopy={onCopy}
					position="bottom"
				/>
			</div>
			<span className="w-full truncate text-center text-fd-muted-foreground text-xs" title={name}>
				{name}
			</span>
		</div>
	);
}

interface CopyButtonProps {
	copyStatus: CopyStatus | null;
	kind: CopyKind;
	name: IconName;
	onCopy: (name: IconName, kind: CopyKind) => void;
	position: 'bottom' | 'top';
}

/** One half of the Heroicons-style split-tile copy control. */
function CopyButton({ copyStatus, kind, name, onCopy, position }: CopyButtonProps) {
	const accessibleLabel = kind === 'jsx' ? `Copy JSX for ${name}` : `Copy name ${name}`;

	return (
		<button
			aria-label={accessibleLabel}
			className={cx(COPY_BUTTON_CLASS_NAME, position === 'top' ? 'top-1' : 'bottom-1')}
			onClick={() => onCopy(name, kind)}
			type="button"
		>
			{copyStatus?.state === 'copied' ? (
				<>
					<Icon aria-hidden className="size-3" name="check" />
					Copied
				</>
			) : copyStatus?.state === 'error' ? (
				'Copy failed'
			) : kind === 'jsx' ? (
				'JSX'
			) : (
				'Name'
			)}
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
