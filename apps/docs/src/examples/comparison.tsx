import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import type { PropsWithChildren } from 'react';

type ComparisonProps = PropsWithChildren<{
	direction?: 'horizontal' | 'vertical';
}>;

type ComparisonItemProps = PropsWithChildren<{
	label: string;
}>;

export function Comparison({ children, direction = 'horizontal' }: ComparisonProps) {
	if (direction === 'vertical') {
		return (
			<Box display="grid" gap="sp16">
				{children}
			</Box>
		);
	}

	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="sp16">
			{children}
		</Box>
	);
}

export function ComparisonItem({ children, label }: ComparisonItemProps) {
	return (
		<Box display="grid" gap="sp4">
			<Text color="secondary" typography="caption">
				{label}
			</Text>
			{children}
		</Box>
	);
}
