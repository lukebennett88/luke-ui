import { Theme } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function DarkPageWithLightPreview({ children }: PropsWithChildren) {
	return (
		<Theme colorMode="dark" name="tactile">
			Dark application
			<Theme colorMode="light">{children}</Theme>
		</Theme>
	);
}
