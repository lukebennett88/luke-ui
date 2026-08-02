import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName, vars } from '@luke-ui/react/theme';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';

type ColorMode = 'dark' | 'light';

const modes: ReadonlyArray<{ label: string; value: ColorMode }> = [
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' },
];

const roles = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;

/**
 * Each panel fixes its own identity and colour mode, so both stay stable no matter which mode the
 * docs page itself is in.
 */
export default function LightAndDarkExample() {
	return (
		<Box display="grid" gap="400" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
			{modes.map((mode) => (
				<Box
					className={cx(themeRootClassName, tactileThemeClassName)}
					data-color-mode={mode.value}
					display="grid"
					gap="300"
					key={mode.value}
					padding="400"
					style={{ backgroundColor: vars.color.surface.canvas, borderRadius: vars.radius.surface }}
				>
					<Text elementType="strong" fontWeight="emphasis">
						{mode.label} mode
					</Text>
					<Box
						display="grid"
						gap="100"
						padding="300"
						style={{
							backgroundColor: vars.color.surface.floating,
							border: `1px solid ${vars.color.border.decorative}`,
							borderRadius: vars.radius.surface,
						}}
					>
						<Text>Card title</Text>
						<Text color="secondary">Supporting text</Text>
					</Box>
					<Box aria-hidden display="flex" flexWrap="wrap" gap="100">
						{roles.map((role) => (
							<Box
								key={role}
								style={{
									backgroundColor: vars.color.background[role].solid.rest,
									blockSize: '1.5rem',
									borderRadius: vars.radius.full,
									inlineSize: '1.5rem',
								}}
							/>
						))}
					</Box>
				</Box>
			))}
		</Box>
	);
}
