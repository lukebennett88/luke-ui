import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { vars } from '@luke-ui/react/theme';

export function DecorativeBox({ style, ...props }: BoxProps) {
	return (
		<Box
			{...props}
			style={{
				backgroundColor: vars.color.surface.recessed,
				backgroundImage: `repeating-linear-gradient(
					-45deg,
					transparent 0,
					transparent 0.25rem,
					${vars.color.border.decorative} 0.25rem,
					${vars.color.border.decorative} 0.375rem
				)`,
				border: `1px solid ${vars.color.border.decorative}`,
				...style,
			}}
		/>
	);
}
