import { vars } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';

export default function SemanticVariablesExample() {
	return (
		<CustomSurface>
			This surface uses public semantic variables from the active theme and colour mode.
		</CustomSurface>
	);
}

function CustomSurface({ children }: PropsWithChildren) {
	return (
		<div
			style={{
				backgroundColor: vars.color.surface.recessed,
				borderRadius: vars.radius.surface,
				boxShadow: vars.depth.recessed,
				color: vars.color.text.primary,
				maxInlineSize: '36rem',
				padding: vars.space[600],
			}}
		>
			{children}
		</div>
	);
}
