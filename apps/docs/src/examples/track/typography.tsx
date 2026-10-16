import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="18rem">
			<Heading level={2}>
				<Track
					elementType="span"
					gap="sp8"
					railAlignment="firstLine"
					railStart={<Icon name="search" />}
				>
					Example heading
				</Track>
			</Heading>
			<Text elementType="div" typography="label">
				<Track gap="sp8" railAlignment="firstLine" railStart={<Icon name="checkCircle" />}>
					<Text shouldInheritFont>
						Example label that wraps onto multiple lines when the available space is limited.
					</Text>
				</Track>
			</Text>
		</Stack>
	);
};
