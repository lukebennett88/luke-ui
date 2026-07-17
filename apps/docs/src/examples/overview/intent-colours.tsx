import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const intents = {
	neutral: {
		border: vars.color.border.decorative,
		description: 'Draft changes have not been shared yet.',
		label: 'Neutral',
		surface: vars.color.intent.neutral.surface.subtle,
		text: vars.color.text.primary,
	},
	accent: {
		border: vars.color.intent.accent.border,
		description: 'Changes are ready to publish.',
		label: 'Accent',
		surface: vars.color.intent.accent.surface.subtle,
		text: vars.color.intent.accent.text,
	},
	success: {
		border: vars.color.intent.success.border,
		description: 'Your changes were published successfully.',
		label: 'Success',
		surface: vars.color.intent.success.surface.subtle,
		text: vars.color.intent.success.text,
	},
	info: {
		border: vars.color.intent.info.border,
		description: 'A new version is available for your team.',
		label: 'Info',
		surface: vars.color.intent.info.surface.subtle,
		text: vars.color.intent.info.text,
	},
	warning: {
		border: vars.color.intent.warning.border,
		description: 'Payment details need review before publishing.',
		label: 'Warning',
		surface: vars.color.intent.warning.surface.subtle,
		text: vars.color.intent.warning.text,
	},
	danger: {
		border: vars.color.intent.danger.border,
		description: 'This action permanently removes the project.',
		label: 'Danger',
		surface: vars.color.intent.danger.surface.subtle,
		text: vars.color.intent.danger.text,
	},
} as const;

type Intent = keyof typeof intents;

export default function IntentColoursExample() {
	const [intent, setIntent] = useState<Intent>('info');
	const selectedIntent = intents[intent];

	return (
		<Box display="grid" gap="400">
			<Box aria-label="Message intent" display="flex" flexWrap="wrap" gap="200" role="group">
				{(Object.keys(intents) as Array<Intent>).map((option) => (
					<Button
						appearance={intent === option ? 'solid' : 'subtle'}
						aria-pressed={intent === option}
						key={option}
						onPress={() => setIntent(option)}
					>
						{intents[option].label}
					</Button>
				))}
			</Box>
			<Box
				display="grid"
				gap="300"
				style={{
					gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
				}}
			>
				<StatusCard intent={selectedIntent} mode="light" />
				<StatusCard intent={selectedIntent} mode="dark" />
			</Box>
			<Text color="secondary" elementType="p" size="200">
				The canvas and card use neutral surface roles. The status uses an intent role, so both adapt
				to the active colour mode.
			</Text>
		</Box>
	);
}

function StatusCard({
	intent,
	mode,
}: {
	intent: (typeof intents)[Intent];
	mode: 'dark' | 'light';
}) {
	return (
		<Box
			aria-label={`Project status in ${mode} mode`}
			data-color-mode={mode}
			padding="400"
			style={{
				backgroundColor: vars.color.surface.canvas,
				borderRadius: vars.radius.surface,
				color: vars.color.text.primary,
			}}
		>
			<Box
				padding="400"
				style={{
					backgroundColor: vars.color.surface.resting,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.resting,
				}}
			>
				<Box alignItems="center" display="flex" gap="200" justifyContent="space-between">
					<Text elementType="strong" fontWeight="emphasis">
						Website launch
					</Text>
					<Text color="secondary" elementType="span" size="200">
						{mode} mode
					</Text>
				</Box>
				<Box
					marginBlockStart="400"
					padding="300"
					role="status"
					style={{
						backgroundColor: intent.surface,
						border: `1px solid ${intent.border}`,
						borderRadius: vars.radius.control,
						color: intent.text,
					}}
				>
					<Text elementType="strong" fontWeight="emphasis">
						{intent.label}
					</Text>
					<Text elementType="p">{intent.description}</Text>
				</Box>
			</Box>
		</Box>
	);
}
