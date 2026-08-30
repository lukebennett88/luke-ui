import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { LoadingSpinnerProps } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';

const colours: Array<{ label: string; color?: LoadingSpinnerProps['color'] }> = [
	{ label: 'Inherited' },
	{ label: 'Primary', color: 'primary' },
	{ label: 'Secondary', color: 'secondary' },
	{ label: 'Accent', color: 'accent' },
	{ label: 'Info', color: 'info' },
	{ label: 'Success', color: 'success' },
	{ label: 'Warning', color: 'warning' },
	{ label: 'Danger', color: 'danger' },
] as const;

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			{colours.map(({ color, label }) => (
				<Box alignItems="center" display="grid" gap="sp4" key={label}>
					<Text color="secondary" typography="caption">
						{label}
					</Text>
					{color ? (
						<LoadingSpinner aria-label="Loading" color={color} />
					) : (
						<LoadingSpinner aria-label="Loading" />
					)}
				</Box>
			))}
		</Box>
	);
};
