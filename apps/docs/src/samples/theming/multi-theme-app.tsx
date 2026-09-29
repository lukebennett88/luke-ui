import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { getThemeClassName } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

// The same kebab-case `name` the product theme's `ThemeInput` declares.
const productThemeClassName = getThemeClassName('product');

type AppProps = PropsWithChildren<{ productStylesheetHref: string }>;

export function App({ children, productStylesheetHref }: AppProps) {
	return (
		<>
			<link href={productStylesheetHref} rel="stylesheet" />
			<div className={productThemeClassName}>{children}</div>
		</>
	);
}
