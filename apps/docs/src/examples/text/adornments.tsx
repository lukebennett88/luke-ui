import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="18rem">
			<Text elementType="p" startContent={<Icon name="checkCircle" size="small" />}>
				Example message that wraps onto a second line
			</Text>
			<Text
				elementType="p"
				endContent={<Kbd>⌘K</Kbd>}
				startContent={<Icon name="search" size="small" />}
				typography="label"
			>
				Example label with a shortcut
			</Text>
		</Stack>
	);
};
