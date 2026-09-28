import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Button } from '@luke-ui/react/primitives/button';
import { Track } from '@luke-ui/react/track';
import {
	createContext,
	lazy,
	Suspense,
	startTransition,
	use,
	useCallback,
	useEffect,
	useMemo,
	useLayoutEffect,
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
import {
	DOCS_SEARCH_FIELD_VT_SHARE_DURATION_MS,
	searchFieldViewTransition,
} from './search-view-transition.js';
import * as styles from './search.css.js';

const DocsSearchDialog = lazy(() =>
	import('./search-dialog.js').then((module) => ({ default: module.DocsSearchDialog })),
);

interface SearchContextValue {
	compactTriggerRef: RefObject<HTMLElement | null>;
	isOpen: boolean;
	openSearch: (source?: 'compact' | 'wide') => void;
	preloadSearchDialog: () => void;
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
	const [hasOpened, setHasOpened] = useState(false);
	const [anchor, setAnchor] = useState<SearchAnchorRect | null>(null);
	const focusRestoreRef = useRef<HTMLElement | null>(null);
	const lastOpenSourceRef = useRef<'compact' | 'wide'>('wide');
	const wideTriggerRef = useRef<HTMLElement | null>(null);
	const compactTriggerRef = useRef<HTMLElement | null>(null);
	const pendingOpenRef = useRef<(() => void) | null>(null);

	const mountSearchDialog = useCallback(() => {
		void import('./search-dialog.js').then(() => {
			setHasOpened(true);
		});
	}, []);

	const updateAnchor = useCallback((source?: 'compact' | 'wide') => {
		const trigger = resolveSearchTrigger(wideTriggerRef, compactTriggerRef, source);
		const measured = measureSearchAnchor(trigger);
		setAnchor(measured ? fitSearchAnchorToViewport(measured) : null);
	}, []);

	const setSearchOpen = useCallback((nextOpen: boolean) => {
		startTransition(() => setIsOpen(nextOpen));
	}, []);

	const restoreSearchFocus = useCallback(() => {
		const previous = focusRestoreRef.current;
		if (previous?.isConnected) {
			previous.focus();
			return;
		}
		if (lastOpenSourceRef.current === 'compact') {
			compactTriggerRef.current?.focus();
			return;
		}
		wideTriggerRef.current?.querySelector('button')?.focus();
	}, []);

	const openSearch = useCallback(
		(source?: 'compact' | 'wide') => {
			lastOpenSourceRef.current =
				source ?? (isSearchTriggerVisible(wideTriggerRef.current) ? 'wide' : 'compact');
			focusRestoreRef.current =
				document.activeElement instanceof HTMLElement ? document.activeElement : null;
			const applyOpen = () => {
				updateAnchor(source);
				startTransition(() => setIsOpen(true));
			};
			if (hasOpened) {
				pendingOpenRef.current = null;
				applyOpen();
				return;
			}
			pendingOpenRef.current = applyOpen;
			mountSearchDialog();
		},
		[hasOpened, mountSearchDialog, updateAnchor],
	);

	useLayoutEffect(() => {
		if (!hasOpened || !pendingOpenRef.current) return;
		const frame = requestAnimationFrame(() => {
			const applyOpen = pendingOpenRef.current;
			pendingOpenRef.current = null;
			applyOpen?.();
		});
		return () => cancelAnimationFrame(frame);
	}, [hasOpened]);

	useEffect(() => {
		mountSearchDialog();
	}, [mountSearchDialog]);

	const wasOpenRef = useRef(false);
	useEffect(() => {
		if (isOpen) {
			wasOpenRef.current = true;
			return;
		}
		if (!wasOpenRef.current) return;
		wasOpenRef.current = false;
		const timeout = window.setTimeout(restoreSearchFocus, DOCS_SEARCH_FIELD_VT_SHARE_DURATION_MS);
		return () => window.clearTimeout(timeout);
	}, [isOpen, restoreSearchFocus]);

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
			preloadSearchDialog: mountSearchDialog,
			setSearchOpen,
			wideTriggerRef,
		}),
		[compactTriggerRef, isOpen, mountSearchDialog, openSearch, setSearchOpen, wideTriggerRef],
	);

	return (
		<SearchContext value={contextValue}>
			{children}
			{hasOpened && (
				<Suspense fallback={null}>
					<DocsSearchDialog anchor={anchor} isOpen={isOpen} onOpenChange={setSearchOpen} />
				</Suspense>
			)}
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
	const { compactTriggerRef, isOpen, openSearch, preloadSearchDialog, wideTriggerRef } = context;
	if (isCompact) {
		return (
			<IconButton
				aria-label="Open Search"
				icon="search"
				onPointerEnter={preloadSearchDialog}
				onPress={() => openSearch('compact')}
				ref={(node) => {
					compactTriggerRef.current = node;
				}}
				size="small"
			/>
		);
	}

	if (isOpen) {
		return (
			<span
				aria-hidden
				className={styles.triggerSlotReserve}
				ref={(node) => {
					wideTriggerRef.current = node;
				}}
			/>
		);
	}

	return (
		<ViewTransition {...searchFieldViewTransition}>
			<div
				className={styles.fieldMorphHost}
				ref={(node) => {
					wideTriggerRef.current = node;
				}}
			>
				<Button
					aria-label="Search documentation"
					className={styles.trigger}
					isBlock
					onPointerEnter={preloadSearchDialog}
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
			</div>
		</ViewTransition>
	);
}
