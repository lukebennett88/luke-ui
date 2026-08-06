import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { useLinkProps } from '@tanstack/react-router';
import { usePathname } from 'fumadocs-core/framework';
import Link from 'fumadocs-core/link';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { FullSearchTrigger, SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import type { ComponentProps } from 'react';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { GithubMark } from './github-mark.js';
import { StorybookMark } from './storybook-mark.js';
import { ThemeControls } from './theme-controls.js';

export const SITE_NAV_BUTTON_CLASS_NAME =
	'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-fd-muted-foreground text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

interface SiteNavProps extends ComponentProps<'header'> {
	hasSidebarNavigation?: boolean;
	hideActiveDestination?: boolean;
}

export function SiteNav({
	children,
	className,
	hasSidebarNavigation = false,
	hideActiveDestination = false,
	...props
}: SiteNavProps) {
	const pathname = usePathname();
	const activeDestination = hideActiveDestination ? undefined : getActiveSiteDestination(pathname);

	return (
		<header
			{...props}
			className={cx(
				'flex shrink-0 flex-wrap items-center gap-x-3 border-fd-border border-b bg-fd-background/80 px-4 backdrop-blur-sm md:gap-x-4 md:px-6',
				className,
			)}
		>
			<SiteWordmark />
			<nav
				aria-label="Site"
				className={cx(
					'flex items-center gap-4',
					hasSidebarNavigation
						? 'h-14 max-lg:hidden'
						: 'order-last w-full pb-2 md:order-none md:h-14 md:w-auto md:pb-0',
				)}
			>
				{siteDestinations.map((destination) => {
					const isActive = destination === activeDestination;
					const isStorybook = destination.label === 'Storybook';

					return (
						<Link
							aria-current={isActive ? 'page' : undefined}
							className={cx(
								'inline-flex items-center gap-1.5 text-sm transition-colors',
								isActive
									? 'font-medium text-fd-primary'
									: 'text-fd-muted-foreground hover:text-fd-accent-foreground',
							)}
							external={destination.isExternal}
							href={destination.url}
							key={destination.url}
						>
							{isStorybook ? <StorybookMark className="size-4" /> : null}
							{destination.label}
						</Link>
					);
				})}
			</nav>
			<div className="ms-auto flex h-14 shrink-0 items-center gap-2">
				<FullSearchTrigger className="w-40 max-md:hidden lg:w-56" hideIfDisabled />
				<SearchTrigger className="md:hidden" hideIfDisabled />
				<div className="max-md:hidden">
					<ThemeControls />
				</div>
				<AppearancePopover />
				<RepositoryLink />
				{children}
			</div>
		</header>
	);
}

function SiteWordmark() {
	const linkProps = useLinkProps({
		activeProps: {},
		className: 'flex h-14 shrink-0 items-center truncate font-semibold text-sm',
		params: { _splat: '' },
		to: '/$',
	});

	return (
		<a {...linkProps} aria-current={undefined} data-status={undefined}>
			Luke UI
		</a>
	);
}

function AppearancePopover() {
	return (
		<Popover>
			<PopoverTrigger
				className={cx(
					SITE_NAV_BUTTON_CLASS_NAME,
					'md:hidden data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground',
				)}
			>
				Theme
			</PopoverTrigger>
			<PopoverContent align="end" className="w-auto">
				<ThemeControls />
			</PopoverContent>
		</Popover>
	);
}

function RepositoryLink() {
	return (
		<a
			className={cx(SITE_NAV_BUTTON_CLASS_NAME, 'w-8 px-0')}
			href={GITHUB_REPO_URL}
			rel="noreferrer noopener"
			target="_blank"
		>
			<GithubMark className="size-4" />
			<VisuallyHidden>GitHub repository</VisuallyHidden>
		</a>
	);
}
