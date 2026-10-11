import { themeClassName } from '@luke-ui/theme-tactile';
import type { PropsWithChildren } from 'react';

// Runs before first paint. It sets an explicit mode only. Without one, the theme follows the
// system preference, so `system` needs no attribute.
const colorModeScript = `
try {
	const mode = localStorage.getItem('color-mode');
	if (mode === 'light' || mode === 'dark') document.documentElement.dataset.colorMode = mode;
} catch {}
`;

export function RootLayout({ children }: PropsWithChildren) {
	return (
		// The script changes `<html>` before React hydrates it.
		<html className={themeClassName} lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: colorModeScript }} />
			</head>
			<body>{children}</body>
		</html>
	);
}
