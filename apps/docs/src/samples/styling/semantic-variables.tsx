import { vars } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function FloatingPanel({ children }: PropsWithChildren) {
	return (
		<aside
			style={{
				backgroundColor: vars.color.background.surface.subdued,
				borderRadius: vars.radius.surface,
				boxShadow: vars.shadow.floating,
				color: vars.color.foreground.primary,
			}}
		>
			{children}
		</aside>
	);
}
