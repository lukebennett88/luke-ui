import type { IconProps } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="startContent">
				<Stack gap="sp24" maxInlineSize="14rem">
					{rows.map(({ size, typography }) => {
						return (
							<Text
								elementType="p"
								key={typography}
								startContent={<Icon name="checkCircle" size={size} />}
								typography={typography}
							>
								{`${typography} that wraps`}
							</Text>
						);
					})}
				</Stack>
			</ComparisonItem>
		</Comparison>
	);
};

const rows: Array<{ size: IconProps['size']; typography: TextProps['typography'] }> = [
	{ size: 'xsmall', typography: 'caption' },
	{ size: 'xsmall', typography: 'label' },
	{ size: 'small', typography: 'body' },
	{ size: 'medium', typography: 'heading4' },
	{ size: 'medium', typography: 'heading2' },
	{ size: 'large', typography: 'heading1' },
];
