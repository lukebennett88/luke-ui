import { Icon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import {
	SidebarCollapseTrigger,
	SidebarTrigger,
	useSidebar,
} from 'fumadocs-ui/layouts/notebook/slots/sidebar';
import { SITE_NAV_BUTTON_CLASS_NAME, SiteNav } from './site-nav.js';

const TRIGGER_CLASS_NAME = cx(SITE_NAV_BUTTON_CLASS_NAME, 'w-8 px-0');

export function DocsSiteNav() {
	return (
		<SiteNav
			// Fumadocs uses this variable to offset the sidebar and table of contents.
			className="sticky top-(--fd-docs-row-1) z-10 [grid-area:header] layout:[--fd-header-height:--spacing(14)]"
			hasSidebarNavigation
		>
			<DocsSidebarTriggers />
		</SiteNav>
	);
}

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
