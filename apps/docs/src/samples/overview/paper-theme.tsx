import '@luke-ui/react/themes/paper.css';
import { rootClassName } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return <div className={rootClassName}>{children}</div>;
}
