import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="18rem">
			<Text elementType="p" startContent={<Icon name="checkCircle" size="small" />}>
				Example message that wraps onto a second line
			</Text>
			<Link href="#navigation">
				<Text
					elementType="div"
					shouldDisableTrim
					shouldInheritFont
					startContent={<Icon name="search" size="small" />}
				>
					Navigation
				</Text>
			</Link>
			<Text elementType="p">
				See the{' '}
				<Link href="https://example.com">
					<Text endContent={<Icon name="externalLink" size="xsmall" />} shouldInheritFont>
						example page
					</Text>
				</Link>{' '}
				for details.
			</Text>
		</Stack>
	);
};
