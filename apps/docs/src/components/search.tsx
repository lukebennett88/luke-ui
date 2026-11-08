import { IconButton } from '@luke-ui/react/icon-button';
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
} from 'react';
import type { PressEvent } from 'react-aria-components/Button';
import { flushSync } from 'react-dom';
import type { SearchAnchorRect } from './search-anchor.js';
import { fitSearchAnchorToViewport, measureSearchAnchor } from './search-anchor.js';
import { DocsSearchDialog } from './search-dialog.js';

interface SearchContextValue {
	isOpen: boolean;
	/** Pass the opening press's `pointerType`, so a touch open can commit inside the tap. */
	openSearch: (pointerType?: PressEvent['pointerType']) => void;
	setSearchOpen: (isOpen: boolean) => void;
	triggerRef: RefObject<HTMLElement | null>;
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

export function DocsSearchProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [anchor, setAnchor] = useState<SearchAnchorRect | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);

	const updateAnchor = useCallback(() => {
		const measured = measureSearchAnchor(triggerRef.current);
		setAnchor(measured ? fitSearchAnchorToViewport(measured) : null);
	}, []);

	// Both open and close must run in a transition, or React skips the View Transition morph.
	const setSearchOpen = useCallback((nextOpen: boolean) => {
		startTransition(() => setIsOpen(nextOpen));
	}, []);

	const openSearch = useCallback(
		(pointerType?: PressEvent['pointerType']) => {
			updateAnchor();
			// iOS raises the keyboard only when `focus()` runs inside the tap, and a transition commits
			// too late. So a touch (or pen) press commits synchronously and skips the morph. Keyboard,
			// mouse, and virtual presses keep the animated path. A press always reports its pointer
			// type, so no `(pointer: coarse)` check is needed, which would also catch a mouse on a
			// hybrid device.
			if (pointerType === 'touch' || pointerType === 'pen') {
				flushSync(() => setIsOpen(true));
				return;
			}
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
			isOpen,
			openSearch,
			setSearchOpen,
			triggerRef,
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

export function getIsMacKeyboardPlatformSnapshot() {
	return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function DocsSearchTrigger({ className }: { className?: string }) {
	const context = use(SearchContext);
	if (!context) throw new Error('DocsSearchTrigger must be inside DocsSearchProvider');
	const { openSearch, triggerRef } = context;
	return (
		<IconButton
			aria-label="Open Search"
			className={className}
			icon="search"
			onPress={(event) => openSearch(event.pointerType)}
			prominence="low"
			ref={(node) => {
				triggerRef.current = node;
			}}
			size="medium"
		/>
	);
}
