import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { cx } from '@luke-ui/react/utils';
import type { PropsWithChildren } from 'react';

type AppProps = PropsWithChildren<{ secondThemeStylesheetHref: string }>;

/**
 * When the same document loads more than one theme stylesheet, apply a bundled theme's
 * `themeClassName` so that theme can win over another theme's `:root` fallback.
 */
export function App({ children, secondThemeStylesheetHref }: AppProps) {
	return (
		<>
			<link href={secondThemeStylesheetHref} rel="stylesheet" />
			<div className={cx(rootClassName, tactileThemeClassName)}>{children}</div>
		</>
	);
}
