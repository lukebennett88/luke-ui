import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return <div data-color-mode="dark">{children}</div>;
}
