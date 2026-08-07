import '@luke-ui/react/themes/paper.css';
import { Theme } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return <Theme name="paper">{children}</Theme>;
}
