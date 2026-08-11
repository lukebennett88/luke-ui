import { Link, useParams, useRouter, useRouterState } from '@tanstack/react-router';
import { FrameworkProvider } from 'fumadocs-core/framework';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { getDocsTreePathname } from '../lib/component-page-navigation.js';

const framework = {
	Link({ href, prefetch = true, ...props }: ComponentProps<'a'> & { prefetch?: boolean }) {
		return <Link preload={prefetch ? 'intent' : false} to={href} {...props} />;
	},
	useParams() {
		return useParams({ strict: false });
	},
	usePathname() {
		const { isLoading, pathname } = useRouterState({
			select: (state) => ({
				isLoading: state.isLoading,
				pathname: state.location.pathname,
			}),
		});
		const activePathname = useRef(pathname);
		return useMemo(() => {
			if (isLoading) return getDocsTreePathname(activePathname.current);
			activePathname.current = pathname;
			return getDocsTreePathname(pathname);
		}, [isLoading, pathname]);
	},
	useRouter() {
		const router = useRouter();
		return useMemo(
			() => ({
				push(url: string) {
					void router.navigate({ href: url });
				},
				refresh() {
					void router.invalidate();
				},
			}),
			[router],
		);
	},
};

/**
 * Wraps Fumadocs' framework context so the sidebar tree inside `DocsLayout` matches
 * Props pages to their Guide pathname. Props pages are hidden from the page tree, so
 * without this remap Fumadocs falls back to the full tree instead of the Components root.
 */
export function DocsTreePathnameProvider({ children }: { children: ReactNode }) {
	return <FrameworkProvider {...framework}>{children}</FrameworkProvider>;
}
