import { Link, useParams, useRouter, useRouterState } from '@tanstack/react-router';
import { FrameworkProvider } from 'fumadocs-core/framework';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';

const framework = {
	Link({ href, prefetch = true, ...props }: ComponentProps<'a'> & { prefetch?: boolean }) {
		return <Link preload={prefetch ? 'intent' : false} to={href} {...props} />;
	},
	useParams() {
		return useParams({ strict: false });
	},
	usePathname() {
		return useRouterState({ select: (state) => state.location.pathname });
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

/** Wraps Fumadocs' framework context so `DocsLayout` gets TanStack Router's Link, params, pathname, and router. */
export function DocsTreePathnameProvider({ children }: { children: ReactNode }) {
	return <FrameworkProvider {...framework}>{children}</FrameworkProvider>;
}
