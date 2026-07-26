import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName, vars } from '@luke-ui/react/theme';
import { paperThemeClassName, tactileThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import { useState } from 'react';

type ColorMode = 'dark' | 'light';
type Identity = 'paper' | 'tactile';

export default function IdentityAndModeExample() {
	const [colorMode, setColorMode] = useState<ColorMode>('light');
	const [identity, setIdentity] = useState<Identity>('tactile');
	const identityClassName = identity === 'tactile' ? tactileThemeClassName : paperThemeClassName;

	return (
		<Box
			className={cx(themeRootClassName, identityClassName)}
			data-color-mode={colorMode}
			display="grid"
			gap="400"
			padding="600"
			style={{
				backgroundColor: vars.color.surface.canvas,
				color: vars.color.text.primary,
			}}
		>
			<Box display="grid" gap="200">
				<Text elementType="strong" fontWeight="emphasis">
					Identity
				</Text>
				<Box aria-label="Theme identity" display="flex" flexWrap="wrap" gap="200" role="group">
					{(['tactile', 'paper'] as const).map((option) => (
						<Button
							appearance={identity === option ? 'solid' : 'subtle'}
							aria-pressed={identity === option}
							key={option}
							onPress={() => setIdentity(option)}
							tone="accent"
						>
							{option === 'tactile' ? 'Tactile' : 'Paper'}
						</Button>
					))}
				</Box>
			</Box>
			<Box display="grid" gap="200">
				<Text elementType="strong" fontWeight="emphasis">
					Colour mode
				</Text>
				<Box aria-label="Colour mode" display="flex" flexWrap="wrap" gap="200" role="group">
					{(['light', 'dark'] as const).map((option) => (
						<Button
							appearance={colorMode === option ? 'solid' : 'subtle'}
							aria-pressed={colorMode === option}
							key={option}
							onPress={() => setColorMode(option)}
							tone="accent"
						>
							{option === 'light' ? 'Light' : 'Dark'}
						</Button>
					))}
				</Box>
			</Box>
			<Box
				alignItems="center"
				display="flex"
				gap="300"
				justifyContent="space-between"
				padding="400"
				style={{
					backgroundColor: vars.color.surface.floating,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					color: vars.color.text.primary,
				}}
			>
				<Text>Preview</Text>
				<Button size="small" tone="accent">
					Action
				</Button>
			</Box>
		</Box>
	);
}
