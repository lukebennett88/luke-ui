import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-paper/fonts.css';
import '@luke-ui/theme-paper/stylesheet.css';
import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName } from '@luke-ui/theme-paper';
import type { PropsWithChildren } from 'react';

export function RootLayout({ children }: PropsWithChildren) {
	return (
		<html className={themeClassName} lang="en">
			<body className={rootClassName}>{children}</body>
		</html>
	);
}
