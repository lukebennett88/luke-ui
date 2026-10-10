import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-tactile/fonts.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { themeClassName } from '@luke-ui/theme-tactile';
import type { PropsWithChildren } from 'react';

export function RootLayout({ children }: PropsWithChildren) {
	return (
		<html className={themeClassName} lang="en">
			<body>{children}</body>
		</html>
	);
}
