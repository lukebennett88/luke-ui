import { IconButton } from '@luke-ui/react/icon-button';
import type { ReactNode } from 'react';
import {
	createContext,
	startTransition,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import type { PressEvent } from 'react-aria-components/Button';
import { flushSync } from 'react-dom';
import { DocsSearchDialog } from './search-dialog.js';

interface SearchContextValue {
	isOpen: boolean;
	/** Pass the opening press's `pointerType`, so a touch open can commit inside the tap. */
	openSearch: (pointerType?: PressEvent['pointerType']) => void;
	setSearchOpen: (isOpen: boolean) => void;
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
	const setSearchOpen = useCallback((nextOpen: boolean) => {
		startTransition(() => setIsOpen(nextOpen));
	}, []);

	const openSearch = useCallback(
		(pointerType?: PressEvent['pointerType']) => {
			// iOS raises the keyboard only when `focus()` runs inside the tap, and a transition commits
			// too late. So a touch (or pen) press commits synchronously. Keyboard, mouse, and virtual
			// presses open in a transition. A press always reports its pointer type, so no
			// `(pointer: coarse)` check is needed, which would also catch a mouse on a hybrid device.
			if (pointerType === 'touch' || pointerType === 'pen') {
				flushSync(() => setIsOpen(true));
				return;
			}
			setSearchOpen(true);
		},
		[setSearchOpen],
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

	const contextValue = useMemo<SearchContextValue>(
		() => ({
			isOpen,
			openSearch,
			setSearchOpen,
		}),
		[isOpen, openSearch, setSearchOpen],
	);

	return (
		<SearchContext value={contextValue}>
			{children}
			<DocsSearchDialog isOpen={isOpen} onOpenChange={setSearchOpen} />
		</SearchContext>
	);
}

export function getIsMacKeyboardPlatformSnapshot() {
	return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function DocsSearchTrigger({ className }: { className?: string }) {
	const context = use(SearchContext);
	if (!context) throw new Error('DocsSearchTrigger must be inside DocsSearchProvider');
	const { openSearch } = context;
	return (
		<IconButton
			aria-label="Open Search"
			className={className}
			icon="search"
			onPress={(event) => openSearch(event.pointerType)}
			prominence="low"
			size="medium"
		/>
	);
}
