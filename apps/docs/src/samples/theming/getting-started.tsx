import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/machined-edge.css';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName } from '@luke-ui/react/theme';
import { machinedEdgeThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return (
		<div className={cx(themeRootClassName, machinedEdgeThemeClassName)}>
			<Text>Hello world</Text>
			{children}
		</div>
	);
}
