import { IconButton } from '@luke-ui/react/icon-button';
import type { ReactNode } from 'react';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { DocsSearchDialog } from './search-dialog.js';

interface SearchContextValue {
	isOpen: boolean;
	openSearch: () => void;
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
	const [isOpen, setSearchOpen] = useState(false);

	const openSearch = useCallback(() => {
		// iOS raises the keyboard only when `focus()` runs inside the gesture, so every open commits
		// synchronously rather than in a transition, which would commit too late.
		flushSync(() => setSearchOpen(true));
	}, []);

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
			onPress={openSearch}
			prominence="low"
			size="medium"
		/>
	);
}
