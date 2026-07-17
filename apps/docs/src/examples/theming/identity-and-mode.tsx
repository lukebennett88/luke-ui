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
	const [previewColorMode, setPreviewColorMode] = useState<ColorMode>('dark');
	const identityClassName = identity === 'tactile' ? tactileThemeClassName : paperThemeClassName;

	return (
		<Box
			className={cx(themeRootClassName, identityClassName)}
			data-color-mode={colorMode}
			display="grid"
			gap="400"
			padding="600"
			style={{
				backgroundColor: vars.color.surface.resting,
				color: vars.color.text.primary,
			}}
		>
			<Box display="grid" gap="200">
				<Text elementType="strong" fontWeight="emphasis">
					Boundary identity
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
					Boundary colour mode
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
				padding="600"
				render={(props) => <section {...props} />}
				style={{
					backgroundColor: vars.color.surface.resting,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.resting,
					color: vars.color.text.primary,
				}}
			>
				<Box alignItems="center" display="flex" gap="300" justifyContent="space-between">
					<Box display="grid" gap="100">
						<Text elementType="strong" fontWeight="emphasis">
							Boundary content
						</Text>
						<Text color="secondary" elementType="span" size="200">
							{identity === 'tactile' ? 'Tactile material' : 'Paper material'} in {colorMode} mode
						</Text>
					</Box>
					<Button size="small" tone="accent">
						View all
					</Button>
				</Box>
				<Box marginBlockStart="400">
					<Text elementType="p">
						The same components respond to the identity and colour mode of this local boundary.
					</Text>
				</Box>
				<Box
					data-color-mode={previewColorMode}
					marginBlockStart="400"
					padding="400"
					style={{
						backgroundColor: vars.color.surface.recessed,
						border: `1px solid ${vars.color.border.decorative}`,
						borderRadius: vars.radius.control,
						color: vars.color.text.primary,
					}}
				>
					<Box
						alignItems="center"
						display="flex"
						flexWrap="wrap"
						gap="300"
						justifyContent="space-between"
					>
						<Box display="grid" gap="100">
							<Text elementType="strong" fontWeight="emphasis">
								Nested preview
							</Text>
							<Text color="secondary" elementType="span" size="200">
								Overrides the boundary with {previewColorMode} mode
							</Text>
						</Box>
						<Box aria-label="Nested preview colour mode" display="flex" gap="200" role="group">
							{(['light', 'dark'] as const).map((option) => (
								<Button
									appearance={previewColorMode === option ? 'solid' : 'subtle'}
									aria-pressed={previewColorMode === option}
									key={option}
									onPress={() => setPreviewColorMode(option)}
									size="small"
									tone="accent"
								>
									{option === 'light' ? 'Light' : 'Dark'}
								</Button>
							))}
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
