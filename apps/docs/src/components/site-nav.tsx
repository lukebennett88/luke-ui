import { cx } from '@luke-ui/react/utils';
import { usePathname } from 'fumadocs-core/framework';
import Link from 'fumadocs-core/link';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { FullSearchTrigger, SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import type { ComponentProps } from 'react';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { ThemeControls } from './theme-controls.js';

/** Shared treatment for the bar's own small controls, so surfaces adding one match. */
export const SITE_NAV_BUTTON_CLASS_NAME =
	'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-fd-muted-foreground text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

interface SiteNavProps extends ComponentProps<'header'> {
	/**
	 * Set by a surface whose sidebar also lists the destinations. Fumadocs shows
	 * those sidebar entries below `lg`, so the bar hides its own copy at the same
	 * breakpoint rather than printing the destinations twice. Surfaces without a
	 * sidebar leave this off, and get the destinations at every width — on a
	 * second row below `md`, where they no longer fit beside the controls.
	 */
	hasSidebarNavigation?: boolean;
}

/**
 * The one chrome bar shared by every surface: the docs routes render it as their
 * layout header slot, the playground and the 404 render it directly. All of them
 * therefore carry the same wordmark, destinations, search, and appearance
 * controls.
 *
 * The bar's first row is a fixed `h-14`, which the docs layout depends on — see
 * `docs-site-nav.tsx`. Everything in that row is sized to still fit at 320px, so
 * it never wraps and quietly makes the bar taller than the layout believes.
 *
 * `children` is a trailing slot for controls only one surface has, such as the
 * docs sidebar triggers.
 */
export function SiteNav({
	children,
	className,
	hasSidebarNavigation = false,
	...props
}: SiteNavProps) {
	const activeDestination = getActiveSiteDestination(usePathname());

	return (
		<header
			{...props}
			className={cx(
				'flex shrink-0 flex-wrap items-center gap-x-3 border-fd-border border-b bg-fd-background/80 px-4 backdrop-blur-sm md:gap-x-4 md:px-6',
				className,
			)}
		>
			<Link className="flex h-14 items-center truncate font-semibold text-sm" href="/">
				Luke UI
			</Link>
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

					return (
						<Link
							aria-current={isActive ? 'page' : undefined}
							className={cx(
								'text-sm transition-colors',
								isActive
									? 'font-medium text-fd-primary'
									: 'text-fd-muted-foreground hover:text-fd-accent-foreground',
							)}
							external={destination.isExternal}
							href={destination.url}
							key={destination.url}
						>
							{destination.label}
						</Link>
					);
				})}
			</nav>
			<div className="ms-auto flex h-14 shrink-0 items-center gap-2">
				{/* Narrow at `md`, where the playground's destinations share the row. */}
				<FullSearchTrigger className="w-40 max-md:hidden lg:w-56" hideIfDisabled />
				<SearchTrigger className="md:hidden" hideIfDisabled />
				<div className="max-md:hidden">
					<ThemeControls />
				</div>
				<AppearancePopover />
				{children}
			</div>
		</header>
	);
}

/**
 * The appearance controls are ~230px of pills, which cannot share a 320px row
 * with the wordmark, search, and the docs sidebar trigger. Below `md` they move
 * behind a disclosure instead of wrapping the bar onto a second row — theme
 * choice is a settings-shaped decision, not something a phone needs on screen
 * while reading. The controls themselves are unchanged in either place.
 */
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
