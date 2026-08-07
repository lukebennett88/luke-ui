import { rootClassName } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

type AppProps = PropsWithChildren<{ themeStylesheetHref: string }>;

export function App({ children, themeStylesheetHref }: AppProps) {
	return (
		<>
			<link href={themeStylesheetHref} rel="stylesheet" />
			<div className={rootClassName}>{children}</div>
		</>
	);
}
