import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<Text elementType="p" endContent={<Icon name="chevronRight" size="xsmall" />}>
				Icon: centred on the capitals
			</Text>
			<Text elementType="p" endContent={<Kbd>⌘K</Kbd>}>
				Kbd: centred the same way
			</Text>
			<Text
				elementType="p"
				endContent={
					<Text color="secondary" typography="caption">
						12 items
					</Text>
				}
			>
				Text: centred the same way
			</Text>
			<Text
				elementType="p"
				startContent={
					<Box
						backgroundColor="success.solid.rest"
						blockSize="0.5rem"
						borderRadius="full"
						display="inline-flex"
						elementType="span"
						inlineSize="0.5rem"
					/>
				}
			>
				A status dot beside a paragraph that wraps onto a second line
			</Text>
		</Stack>
	);
};
