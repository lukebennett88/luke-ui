import { themeClassName, themeRootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { PropsWithChildren } from 'react';

type AppProps = PropsWithChildren<{ themeStylesheetHref: string }>;

export function App({ children, themeStylesheetHref }: AppProps) {
	return (
		<>
			<link href={themeStylesheetHref} rel="stylesheet" />
			<div className={cx(themeRootClassName, themeClassName('product'))}>{children}</div>
		</>
	);
}
