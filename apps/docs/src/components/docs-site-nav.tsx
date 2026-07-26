import { Icon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import {
	SidebarCollapseTrigger,
	SidebarTrigger,
	useSidebar,
} from 'fumadocs-ui/layouts/notebook/slots/sidebar';
import { SITE_NAV_BUTTON_CLASS_NAME, SiteNav } from './site-nav.js';

const TRIGGER_CLASS_NAME = cx(SITE_NAV_BUTTON_CLASS_NAME, 'w-8 px-0');

/**
 * The shared nav bound to the docs layout. It adds the sidebar triggers, which
 * only make sense on a surface that has a sidebar, plus the grid placement and
 * declared height the layout needs to tuck the sidebar underneath the nav.
 *
 * `--fd-header-height` is what the layout offsets the sidebar and the table of
 * contents by, so it has to match the bar's real height. `hasSidebarNavigation`
 * keeps the destinations on one row, which keeps that height at `h-14`.
 */
export function DocsSiteNav() {
	return (
		<SiteNav
			className="sticky top-(--fd-docs-row-1) z-10 [grid-area:header] layout:[--fd-header-height:--spacing(14)]"
			hasSidebarNavigation
		>
			<DocsSidebarTriggers />
		</SiteNav>
	);
}

/**
 * Opens the page-tree drawer on mobile, and collapses or expands the sidebar on
 * desktop. Both read the sidebar state from the layout, so this only renders
 * inside the docs layout.
 */
function DocsSidebarTriggers() {
	const { collapsed } = useSidebar();

	return (
		<>
			<SidebarTrigger
				aria-label="Open docs navigation"
				className={cx(TRIGGER_CLASS_NAME, 'md:hidden')}
				type="button"
			>
				<Icon aria-hidden name="bookOpen" size="small" />
			</SidebarTrigger>
			<SidebarCollapseTrigger
				aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				className={cx(TRIGGER_CLASS_NAME, 'max-md:hidden')}
			>
				<Icon aria-hidden name={collapsed ? 'chevronRight' : 'chevronLeft'} size="small" />
			</SidebarCollapseTrigger>
		</>
	);
}
