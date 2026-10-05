import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Button } from '@luke-ui/react/primitives/button';
import { Track } from '@luke-ui/react/track';
import type { ReactNode, RefObject } from 'react';
import {
	createContext,
	startTransition,
	use,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	ViewTransition,
} from 'react';
import type { SearchAnchorRect } from './search-anchor.js';
import {
	fitSearchAnchorToViewport,
	isSearchTriggerVisible,
	measureSearchAnchor,
} from './search-anchor.js';
import { DocsSearchDialog } from './search-dialog.js';
import { searchFieldViewTransition } from './search-view-transition.js';
import * as styles from './search.css.js';

interface SearchContextValue {
	compactTriggerRef: RefObject<HTMLElement | null>;
	isOpen: boolean;
	openSearch: (source?: 'compact' | 'wide') => void;
	setSearchOpen: (isOpen: boolean) => void;
	wideTriggerRef: RefObject<HTMLElement | null>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

function isEditable(target: EventTarget | null) {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
			target.closest('[contenteditable="true"]') !== null)
	);
}

function resolveSearchTrigger(
	wideTriggerRef: RefObject<HTMLElement | null>,
	compactTriggerRef: RefObject<HTMLElement | null>,
	source?: 'compact' | 'wide',
) {
	if (source === 'compact') return compactTriggerRef.current;
	if (source === 'wide') return wideTriggerRef.current;
	if (isSearchTriggerVisible(wideTriggerRef.current)) return wideTriggerRef.current;
	return compactTriggerRef.current;
}

export function DocsSearchProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [anchor, setAnchor] = useState<SearchAnchorRect | null>(null);
	const wideTriggerRef = useRef<HTMLElement | null>(null);
	const compactTriggerRef = useRef<HTMLElement | null>(null);

	const updateAnchor = useCallback((source?: 'compact' | 'wide') => {
		const trigger = resolveSearchTrigger(wideTriggerRef, compactTriggerRef, source);
		const measured = measureSearchAnchor(trigger);
		setAnchor(measured ? fitSearchAnchorToViewport(measured) : null);
	}, []);

	// Both open and close must run in a transition, or React skips the View Transition morph.
	const setSearchOpen = useCallback((nextOpen: boolean) => {
		startTransition(() => setIsOpen(nextOpen));
	}, []);

	// The wide trigger button remounts on close, so React Aria has no node to restore focus to.
	// Wait until the dialog has exited: its focus trap pulls focus back while it is still mounted.
	const restoreWideTriggerFocus = useCallback(() => {
		const host = wideTriggerRef.current;
		if (!isSearchTriggerVisible(host)) return;
		requestAnimationFrame(() => host?.querySelector('button')?.focus());
	}, []);

	const openSearch = useCallback(
		(source?: 'compact' | 'wide') => {
			updateAnchor(source);
			setSearchOpen(true);
		},
		[setSearchOpen, updateAnchor],
	);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (
				event.key.toLowerCase() !== 'k' ||
				!(event.metaKey || event.ctrlKey) ||
				isEditable(event.target)
			)
				return;
			event.preventDefault();
			openSearch();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [openSearch]);

	useLayoutEffect(() => {
		if (!isOpen) return;
		updateAnchor();
	}, [isOpen, updateAnchor]);

	useEffect(() => {
		if (!isOpen) return;
		function onLayoutChange() {
			updateAnchor();
		}
		window.addEventListener('resize', onLayoutChange);
		window.addEventListener('scroll', onLayoutChange);
		return () => {
			window.removeEventListener('resize', onLayoutChange);
			window.removeEventListener('scroll', onLayoutChange);
		};
	}, [isOpen, updateAnchor]);

	const contextValue = useMemo<SearchContextValue>(
		() => ({
			compactTriggerRef,
			isOpen,
			openSearch,
			setSearchOpen,
			wideTriggerRef,
		}),
		[isOpen, openSearch, setSearchOpen],
	);

	return (
		<SearchContext value={contextValue}>
			{children}
			<DocsSearchDialog
				anchor={anchor}
				isOpen={isOpen}
				onExited={restoreWideTriggerFocus}
				onOpenChange={setSearchOpen}
			/>
		</SearchContext>
	);
}

function useIsMacKeyboardPlatform() {
	return useSyncExternalStore(
		subscribeToMacKeyboardPlatform,
		getIsMacKeyboardPlatformSnapshot,
		getIsMacKeyboardPlatformServerSnapshot,
	);
}

function subscribeToMacKeyboardPlatform() {
	return () => {};
}

function getIsMacKeyboardPlatformSnapshot() {
	return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function getIsMacKeyboardPlatformServerSnapshot() {
	return true;
}

function SearchShortcutLabel() {
	const isMac = useIsMacKeyboardPlatform();
	return <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>;
}

export function DocsSearchTrigger({ isCompact = false }: { isCompact?: boolean }) {
	const context = use(SearchContext);
	if (!context) throw new Error('DocsSearchTrigger must be inside DocsSearchProvider');
	if (isCompact) {
		const { compactTriggerRef, openSearch } = context;
		return (
			<IconButton
				aria-label="Open Search"
				icon="search"
				onPress={() => openSearch('compact')}
				ref={(node) => {
					compactTriggerRef.current = node;
				}}
				size="small"
			/>
		);
	}

	return <WideSearchTrigger context={context} />;
}

function WideSearchTrigger({ context }: { context: SearchContextValue }) {
	const { isOpen, openSearch, wideTriggerRef } = context;

	// The share morph needs one named boundary to unmount while another with the same name mounts.
	// In React 19.3, changing `name` on a mounted boundary does nothing. So unmount the trigger
	// boundary while open and keep a hidden placeholder to hold the layout.
	return (
		<div
			className={styles.fieldMorphHost}
			inert={isOpen || undefined}
			ref={(node) => {
				wideTriggerRef.current = node;
			}}
		>
			{isOpen ? (
				<div aria-hidden className={styles.triggerSlotReserve} />
			) : (
				<ViewTransition {...searchFieldViewTransition}>
					<Button
						aria-label="Search documentation"
						className={styles.trigger}
						isBlock
						onPress={() => openSearch('wide')}
						prominence="low"
						size="small"
					>
						<Track
							className={styles.triggerTrack}
							elementType="span"
							gap="sp8"
							railAlignment="center"
							railEnd={<SearchShortcutLabel />}
							railStart={<Icon name="search" />}
						>
							<span className={styles.triggerPlaceholder}>Search</span>
						</Track>
					</Button>
				</ViewTransition>
			)}
		</div>
	);
}
