import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-tactile/fonts.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName } from '@luke-ui/theme-tactile';
import type { PropsWithChildren } from 'react';

export function RootLayout({ children }: PropsWithChildren) {
	return (
		<html className={themeClassName} lang="en">
			<body className={rootClassName}>
				<header />
				<main>{children}</main>
				<footer />
			</body>
		</html>
	);
}
