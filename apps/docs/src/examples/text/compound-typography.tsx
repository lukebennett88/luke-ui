import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Text
			elementType="div"
			gap="sp12"
			startContent={<Icon name="bookOpen" />}
			typography="heading3"
		>
			<Stack gap="sp8" maxInlineSize="20rem">
				<Text elementType="p" lineClamp={1} shouldInheritFont>
					Example title that clamps independently of its description
				</Text>
				<Text color="secondary" elementType="p" typography="caption">
					The description stays below the title in the same content column.
				</Text>
			</Stack>
		</Text>
	);
};
