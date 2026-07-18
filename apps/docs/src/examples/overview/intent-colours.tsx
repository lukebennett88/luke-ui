import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName, vars } from '@luke-ui/react/theme';
import { paperThemeClassName, tactileThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import type { ReactNode } from 'react';
import { useState } from 'react';

type ColorMode = 'dark' | 'light';
type Identity = 'paper' | 'tactile';

const intents = [
	{ label: 'Neutral', name: 'neutral' },
	{ label: 'Accent', name: 'accent' },
	{ label: 'Success', name: 'success' },
	{ label: 'Info', name: 'info' },
	{ label: 'Warning', name: 'warning' },
	{ label: 'Danger', name: 'danger' },
] as const;

export default function IntentColoursExample() {
	const [colorMode, setColorMode] = useState<ColorMode>('light');
	const [identity, setIdentity] = useState<Identity>('tactile');
	const identityClassName = identity === 'tactile' ? tactileThemeClassName : paperThemeClassName;

	return (
		<Box display="grid" gap="400">
			<ThemeControls
				colorMode={colorMode}
				identity={identity}
				onColorModeChange={setColorMode}
				onIdentityChange={setIdentity}
			/>
			<Box
				className={cx(themeRootClassName, identityClassName)}
				data-color-mode={colorMode}
				display="grid"
				gap="400"
				padding="600"
				style={{
					backgroundColor: vars.color.surface.canvas,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					color: vars.color.text.primary,
				}}
			>
				<SurfaceLabel>Canvas surface</SurfaceLabel>
				<Box
					display="grid"
					gap="400"
					padding="400"
					style={{
						backgroundColor: vars.color.surface.recessed,
						borderRadius: vars.radius.surface,
					}}
				>
					<SurfaceLabel>Recessed surface</SurfaceLabel>
					<Box
						display="grid"
						gap="400"
						padding="400"
						style={{
							backgroundColor: vars.color.surface.resting,
							border: `1px solid ${vars.color.border.decorative}`,
							borderRadius: vars.radius.surface,
							boxShadow: vars.depth.resting,
						}}
					>
						<Box alignItems="center" display="flex" gap="300" justifyContent="space-between">
							<Box display="grid" gap="100">
								<SurfaceLabel>Resting surface</SurfaceLabel>
								<Text elementType="strong" fontWeight="emphasis">
									Content uses primary text
								</Text>
								<Text color="secondary" elementType="span" size="200">
									Supporting content uses secondary text
								</Text>
							</Box>
							<Button size="small" tone="accent">
								Action
							</Button>
						</Box>
						<Box
							display="grid"
							gap="200"
							style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))' }}
						>
							{intents.map((intent) => (
								<IntentSample intent={intent.name} key={intent.name} label={intent.label} />
							))}
						</Box>
					</Box>
				</Box>
			</Box>
			<Text color="secondary" elementType="p" size="200">
				The role names stay the same while the active identity and colour mode supply their values.
			</Text>
		</Box>
	);
}

function ThemeControls({
	colorMode,
	identity,
	onColorModeChange,
	onIdentityChange,
}: {
	colorMode: ColorMode;
	identity: Identity;
	onColorModeChange: (colorMode: ColorMode) => void;
	onIdentityChange: (identity: Identity) => void;
}) {
	return (
		<Box display="grid" gap="300">
			<ControlGroup label="Identity">
				{(['tactile', 'paper'] as const).map((option) => (
					<Button
						appearance={identity === option ? 'solid' : 'subtle'}
						aria-pressed={identity === option}
						key={option}
						onPress={() => onIdentityChange(option)}
						size="small"
						tone="accent"
					>
						{option === 'tactile' ? 'Tactile' : 'Paper'}
					</Button>
				))}
			</ControlGroup>
			<ControlGroup label="Colour mode">
				{(['light', 'dark'] as const).map((option) => (
					<Button
						appearance={colorMode === option ? 'solid' : 'subtle'}
						aria-pressed={colorMode === option}
						key={option}
						onPress={() => onColorModeChange(option)}
						size="small"
						tone="accent"
					>
						{option === 'light' ? 'Light' : 'Dark'}
					</Button>
				))}
			</ControlGroup>
		</Box>
	);
}

function ControlGroup({ children, label }: { children: ReactNode; label: string }) {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="200">
			<Text elementType="strong" fontWeight="emphasis" size="200" style={{ inlineSize: '6rem' }}>
				{label}
			</Text>
			<Box aria-label={label} display="flex" flexWrap="wrap" gap="200" role="group">
				{children}
			</Box>
		</Box>
	);
}

function IntentSample({
	intent,
	label,
}: {
	intent: (typeof intents)[number]['name'];
	label: string;
}) {
	if (intent === 'neutral') {
		return (
			<Box
				paddingBlock="200"
				paddingInline="300"
				style={{
					backgroundColor: vars.color.intent.neutral.surface.subtle,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.control,
					color: vars.color.text.primary,
				}}
			>
				<Text elementType="span" fontWeight="label" size="200">
					{label}
				</Text>
			</Box>
		);
	}

	const colors = vars.color.intent[intent];

	return (
		<Box
			paddingBlock="200"
			paddingInline="300"
			style={{
				backgroundColor: colors.surface.subtle,
				border: `1px solid ${colors.border}`,
				borderRadius: vars.radius.control,
				color: colors.text,
			}}
		>
			<Text elementType="span" fontWeight="label" size="200">
				{label}
			</Text>
		</Box>
	);
}

function SurfaceLabel({ children }: { children: ReactNode }) {
	return (
		<Text color="secondary" elementType="span" fontWeight="label" size="100">
			{children}
		</Text>
	);
}
