import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile.css';
import { Text } from '@luke-ui/react/text';
import { Theme } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return (
		<Theme name="tactile">
			<Text>Hello world</Text>
			{children}
		</Theme>
	);
}
