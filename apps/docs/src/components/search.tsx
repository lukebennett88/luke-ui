import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Button } from '@luke-ui/react/primitives/button';
import { Track } from '@luke-ui/react/track';
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
import type { ReactNode, RefObject } from 'react';
import {
	fitSearchAnchorToViewport,
	isSearchTriggerVisible,
	measureSearchAnchor,
} from './search-anchor.js';
import type { SearchAnchorRect } from './search-anchor.js';
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

	// View Transition morph needs the open update in a transition.
	const setSearchOpen = useCallback((nextOpen: boolean) => {
		startTransition(() => setIsOpen(nextOpen));
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
			<DocsSearchDialog anchor={anchor} isOpen={isOpen} onOpenChange={setSearchOpen} />
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
	const { compactTriggerRef, isOpen, openSearch, wideTriggerRef } = context;
	if (isCompact) {
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

	// Keep the same button node mounted while open so React Aria can restore focus to it.
	// Drop the shared VT name once open so only the dialog field owns the morph target.
	return (
		<div
			className={styles.fieldMorphHost}
			ref={(node) => {
				wideTriggerRef.current = node;
			}}
		>
			<ViewTransition
				{...(isOpen
					? { default: 'none', enter: 'none', exit: 'none', name: 'none', share: 'none' }
					: searchFieldViewTransition)}
			>
				<Button
					aria-hidden={isOpen || undefined}
					aria-label="Search documentation"
					className={isOpen ? styles.triggerSlotReserve : styles.trigger}
					isBlock
					onPress={() => openSearch('wide')}
					prominence="low"
					size="small"
					tabIndex={isOpen ? -1 : undefined}
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
		</div>
	);
}
