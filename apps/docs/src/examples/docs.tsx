import { Box } from '@luke-ui/react/box';
import type { BoxProps } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

const ComparisonAlignContext = createContext<'center' | 'start'>('start');

type ComparisonProps = PropsWithChildren<{
	/**
	 * The alignment of items within the comparison
	 * @default 'start'
	 */
	align?: 'center' | 'start';
	/**
	 * The direction of the comparison
	 * @default 'vertical'
	 */
	direction?: 'horizontal' | 'vertical';
}>;

type ComparisonItemProps = PropsWithChildren<{
	label: string;
}>;

export function Comparison({ align = 'start', children, direction = 'vertical' }: ComparisonProps) {
	const Element = direction === 'vertical' ? Stack : Cluster;
	return (
		<ComparisonAlignContext.Provider value={align}>
			<Element
				gap="sp16"
				style={{ inlineSize: 'max-content', marginInline: 'auto', maxInlineSize: '100%' }}
			>
				{children}
			</Element>
		</ComparisonAlignContext.Provider>
	);
}

export function ComparisonItem({ children, label }: ComparisonItemProps) {
	const align = useContext(ComparisonAlignContext);

	return (
		<Stack alignItems={align === 'center' ? 'center' : 'stretch'} gap="sp4">
			<Text color="secondary" textAlign={align} typography="caption">
				{label}
			</Text>
			{children}
		</Stack>
	);
}

export function ExampleItem(props: BoxProps) {
	return (
		<Box
			{...props}
			style={{
				backgroundColor: vars.color.surface.floating,
				border: `1px solid ${vars.color.border.decorative}`,
				borderRadius: vars.radius.detail,
				padding: vars.space.sp12,
				...props.style,
			}}
		/>
	);
}
