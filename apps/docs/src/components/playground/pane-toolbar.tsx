import { cx } from '@luke-ui/react/utils';
import type { ReactNode } from 'react';

type PlaygroundPaneToolbarProps = {
	children: ReactNode;
	className?: string;
};

const TOOLBAR_CLASS_NAME =
	'flex shrink-0 items-center border-fd-border border-b bg-fd-background px-2 py-1.5 sm:px-3';

/** IconToggleButtonGroup: size-8 buttons plus p-0.5 wrapper padding. */
const MIN_BLOCK_SIZE_CLASS_NAME = 'min-block-[calc(2rem+--spacing(0.5)*2+--spacing(1.5)*2+1px)]';

/** Shared toolbar chrome for editor and preview panes so bottom borders align. */
export function PlaygroundPaneToolbar({ children, className }: PlaygroundPaneToolbarProps) {
	return (
		<div className={cx(TOOLBAR_CLASS_NAME, MIN_BLOCK_SIZE_CLASS_NAME, className)}>{children}</div>
	);
}
