import '@luke-ui/react/themes/paper.css';
import { themeRootClassName } from '@luke-ui/react/theme';
import { paperThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import type { PropsWithChildren } from 'react';

export function App({ children }: PropsWithChildren) {
	return <div className={cx(themeRootClassName, paperThemeClassName)}>{children}</div>;
}
