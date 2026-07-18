import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName, vars } from '@luke-ui/react/theme';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import type { ReactNode } from 'react';

const intents = [
	{
		backgroundColor: vars.color.intent.neutral.surface.subtle,
		color: vars.color.text.primary,
		label: 'Neutral',
	},
	{
		backgroundColor: vars.color.intent.accent.surface.subtle,
		color: vars.color.intent.accent.text,
		label: 'Accent',
	},
	{
		backgroundColor: vars.color.intent.info.surface.subtle,
		color: vars.color.intent.info.text,
		label: 'Info',
	},
	{
		backgroundColor: vars.color.intent.success.surface.subtle,
		color: vars.color.intent.success.text,
		label: 'Success',
	},
	{
		backgroundColor: vars.color.intent.warning.surface.subtle,
		color: vars.color.intent.warning.text,
		label: 'Warning',
	},
	{
		backgroundColor: vars.color.intent.danger.surface.subtle,
		color: vars.color.intent.danger.text,
		label: 'Danger',
	},
];

export default function IntentColoursExample() {
	return (
		<Box
			className={cx(themeRootClassName, tactileThemeClassName)}
			display="grid"
			gap="300"
			style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}
		>
			<ColourMode mode="light" />
			<ColourMode mode="dark" />
		</Box>
	);
}

function ColourMode({ mode }: { mode: 'dark' | 'light' }) {
	return (
		<Box
			data-color-mode={mode}
			display="grid"
			gap="400"
			padding="400"
			style={{
				backgroundColor: vars.color.surface.canvas,
				color: vars.color.text.primary,
			}}
		>
			<Text elementType="strong" fontWeight="emphasis">
				{mode === 'light' ? 'Light mode' : 'Dark mode'}
			</Text>
			<ColourGroup label="Surfaces">
				<Sample backgroundColor={vars.color.surface.canvas} label="Canvas" />
				<Sample backgroundColor={vars.color.surface.recessed} label="Recessed" />
				<Sample backgroundColor={vars.color.surface.resting} label="Resting" />
			</ColourGroup>
			<ColourGroup label="Content">
				<Text elementType="span">Primary text</Text>
				<Text color="secondary" elementType="span">
					Secondary text
				</Text>
			</ColourGroup>
			<ColourGroup label="Intents">
				<Box display="grid" gap="100" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
					{intents.map((intent) => (
						<Sample key={intent.label} {...intent} />
					))}
				</Box>
			</ColourGroup>
		</Box>
	);
}

function ColourGroup({ children, label }: { children: ReactNode; label: string }) {
	return (
		<Box display="grid" gap="100">
			<Text color="secondary" elementType="span" fontWeight="label" size="100">
				{label}
			</Text>
			{children}
		</Box>
	);
}

function Sample({
	backgroundColor,
	color = vars.color.text.primary,
	label,
}: {
	backgroundColor: string;
	color?: string;
	label: string;
}) {
	return (
		<Box padding="200" style={{ backgroundColor, color }}>
			<Text elementType="span" fontWeight="label" size="100">
				{label}
			</Text>
		</Box>
	);
}
