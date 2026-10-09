import { vars } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export function FloatingPanel({ children }: PropsWithChildren) {
	return (
		<aside
			style={{
				backgroundColor: vars.color.surface.subdued,
				borderRadius: vars.radius.surface,
				boxShadow: vars.depth.floating,
				color: vars.color.text.primary,
			}}
		>
			{children}
		</aside>
	);
}
