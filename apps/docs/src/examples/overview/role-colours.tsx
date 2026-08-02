import { Box } from '@luke-ui/react/box';
import type { ButtonProps } from '@luke-ui/react/button';
import { Button } from '@luke-ui/react/button';
import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useState } from 'react';

const roles = {
	neutral: 'Neutral',
	accent: 'Accent',
	info: 'Info',
	success: 'Success',
	warning: 'Warning',
	danger: 'Danger',
} as const;

type Role = keyof typeof roles;
type ButtonAppearance = NonNullable<ButtonProps['appearance']>;
type ButtonTone = NonNullable<ButtonProps['tone']>;

interface RoleNotice {
	/** Button only carries `neutral`, `accent`, and `danger` tones, so other roles borrow `neutral`. */
	action: { appearance: ButtonAppearance; label: string; tone: ButtonTone };
	description: string;
	heading: string;
	icon: IconName;
}

const notices: Record<Role, RoleNotice> = {
	accent: {
		action: { appearance: 'subtle', label: 'Manage plan', tone: 'accent' },
		description: 'Your workspace is on this plan.',
		heading: 'Pro plan',
		icon: 'check',
	},
	danger: {
		action: { appearance: 'solid', label: 'Delete', tone: 'danger' },
		description: 'Deleting this project removes all of its data. This cannot be undone.',
		heading: 'Delete project',
		icon: 'closeCircle',
	},
	info: {
		action: { appearance: 'subtle', label: 'View details', tone: 'neutral' },
		description: 'The service restarts for maintenance at midnight UTC.',
		heading: 'Scheduled maintenance',
		icon: 'bookOpen',
	},
	neutral: {
		action: { appearance: 'subtle', label: 'Assign a plan', tone: 'neutral' },
		description: 'This project has no plan assigned.',
		heading: 'No plan assigned',
		icon: 'circleHalf',
	},
	success: {
		action: { appearance: 'subtle', label: 'View receipt', tone: 'neutral' },
		description: 'Your subscription is now active.',
		heading: 'Payment received',
		icon: 'checkCircle',
	},
	warning: {
		action: { appearance: 'subtle', label: 'Update card', tone: 'neutral' },
		description: 'Update your card before the next billing date.',
		heading: 'Payment details need review',
		icon: 'exclamationTriangle',
	},
};

/** Selecting a role keeps the same notice layout, but swaps its colours and its scenario. */
export default function RoleColoursExample() {
	const [role, setRole] = useState<Role>('warning');
	const notice = notices[role];

	return (
		<Box display="grid" gap="400">
			<Box aria-label="Semantic role" display="flex" flexWrap="wrap" gap="200" role="group">
				{(Object.keys(roles) as Array<Role>).map((option) => (
					<Button
						appearance={role === option ? 'solid' : 'subtle'}
						aria-pressed={role === option}
						key={option}
						onPress={() => setRole(option)}
					>
						{roles[option]}
					</Button>
				))}
			</Box>
			<Box
				display="grid"
				gap="300"
				padding="400"
				role="status"
				style={{
					backgroundColor: vars.color.background[role].subtle.rest,
					border: `1px solid ${vars.color.border[role]}`,
					borderRadius: vars.radius.surface,
				}}
			>
				<Box alignItems="flex-start" display="flex" gap="300">
					<Icon
						aria-hidden
						name={notice.icon}
						style={{ color: vars.color.foreground[role].rest }}
					/>
					<Box display="grid" flexGrow="1" gap="100">
						<Box alignItems="center" display="flex" gap="200" justifyContent="space-between">
							<Text
								elementType="strong"
								fontWeight="emphasis"
								style={{ color: vars.color.foreground[role].rest }}
							>
								{notice.heading}
							</Text>
							<Text
								elementType="span"
								fontWeight="emphasis"
								size="100"
								style={{
									backgroundColor: vars.color.background[role].solid.rest,
									borderRadius: vars.radius.full,
									color: vars.color.foreground[role].onSolid,
									padding: `${vars.space[100]} ${vars.space[200]}`,
								}}
							>
								{roles[role]}
							</Text>
						</Box>
						<Text style={{ color: vars.color.foreground[role].rest }}>{notice.description}</Text>
					</Box>
				</Box>
				<Box display="flex" justifyContent="flex-end">
					<Button appearance={notice.action.appearance} size="small" tone={notice.action.tone}>
						{notice.action.label}
					</Button>
				</Box>
			</Box>
		</Box>
	);
}
