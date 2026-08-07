import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { rootClassName } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return (
		<div className={rootClassName} data-color-mode="dark">
			{children}
		</div>
	);
}
