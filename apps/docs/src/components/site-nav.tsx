import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { IconLink } from '@luke-ui/react/icon-link';
import { cx } from '@luke-ui/react/utils';
import { useLinkProps, useRouterState } from '@tanstack/react-router';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsLink } from './docs-link.js';
import { GithubMark } from './github-mark.js';
import { DocsSearchTrigger } from './search.js';
import * as styles from './site-nav.css.js';
import { ThemeControls } from './theme-controls.js';

interface SiteNavProps {
	hideActiveDestination?: boolean;
}

/**
 * The header for pages without the docs sidebar: the home page, the playground, and the 404 page.
 * `DocsSiteNav` composes the same parts around the sidebar.
 */
export function SiteNav({ hideActiveDestination = false }: SiteNavProps) {
	return (
		<SiteHeader>
			<div className={styles.start}>
				<SiteWordmark />
				<DocsSearchTrigger isCompact />
			</div>
			<SiteDestinations
				className={styles.destinations}
				hideActiveDestination={hideActiveDestination}
			/>
			<div className={styles.actions}>
				<AppearancePopover />
				<RepositoryLink />
			</div>
		</SiteHeader>
	);
}

/** The opaque header row on the page chrome. */
export function SiteHeader({ children, className }: Pick<BoxProps, 'children' | 'className'>) {
	return (
		<Box
			backgroundColor="surface.subdued"
			className={cx(styles.header, className)}
			elementType="header"
		>
			{children}
		</Box>
	);
}

export function SiteDestinations({
	className,
	hideActiveDestination = false,
}: {
	className?: string;
	hideActiveDestination?: boolean;
}) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const activeDestination = hideActiveDestination ? undefined : getActiveSiteDestination(pathname);

	return (
		<nav aria-label="Site" className={className}>
			{siteDestinations.map((destination) => (
				<DestinationLink
					destination={destination}
					isActive={destination === activeDestination}
					key={destination.url}
				/>
			))}
		</nav>
	);
}

function DestinationLink({
	destination,
	isActive,
}: {
	destination: (typeof siteDestinations)[number];
	isActive: boolean;
}) {
	// Docs points at `/docs/installation` but must stay current for every `/docs/*` page.
	// TanStack's exact active state alone cannot express that section-level rule.
	return (
		<DocsLink
			activeOptions={{ exact: true }}
			aria-current={isActive ? 'page' : undefined}
			className={cx(styles.destination, isActive && styles.activeDestination)}
			to={destination.url}
		>
			<span aria-hidden="true" className={styles.destinationWidth}>
				{destination.label}
			</span>
			<span className={styles.destinationLabel}>{destination.label}</span>
		</DocsLink>
	);
}

// TanStack's `useLinkProps` returns DOM event handlers that RAC's `Link` cannot accept, so the
// wordmark stays a raw `<a>`. It also overrides `aria-current`: TanStack marks the home route as
// current, while the other destinations use custom matching.
export function SiteWordmark() {
	const linkProps = useLinkProps({ to: '/' });
	return (
		<a {...linkProps} aria-current={undefined} className={styles.wordmark} data-status={undefined}>
			Luke UI
		</a>
	);
}

/** A labelled button that opens the theme controls in a popover. */
export function AppearancePopover({ className }: { className?: string }) {
	return (
		<DialogTrigger>
			<Button className={className} prominence="low">
				Theme
			</Button>
			<Popover className={styles.appearancePopover} placement="bottom end">
				<Dialog aria-label="Appearance">
					<ThemeControls />
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

export function RepositoryLink() {
	return (
		<IconLink
			aria-label="GitHub repository"
			href={GITHUB_REPO_URL}
			icon={<GithubMark />}
			prominence="low"
			rel="noreferrer noopener"
			size="small"
			target="_blank"
		/>
	);
}
