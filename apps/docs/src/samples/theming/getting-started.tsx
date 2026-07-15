import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile.css';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName } from '@luke-ui/react/theme';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return (
		<div className={cx(themeRootClassName, tactileThemeClassName)}>
			<Text>Hello world</Text>
			{children}
		</div>
	);
}
