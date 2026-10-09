import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName } from '@luke-ui/theme-tactile';
import type { PropsWithChildren } from 'react';

export function RootLayout({ children }: PropsWithChildren) {
	return (
		<html className={themeClassName} data-color-mode="dark" lang="en">
			<body className={rootClassName}>{children}</body>
		</html>
	);
}
