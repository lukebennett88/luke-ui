import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="inline Text adornments">
				<Stack gap="sp16" maxInlineSize="16rem">
					<Text elementType="p">
						Status: <Text startContent={<Icon name="checkCircle" size="xsmall" />}>Approved</Text>{' '}
						by the reviewer.
					</Text>
					<Link href="#inline">
						<Text
							elementType="span"
							shouldInheritFont
							startContent={<Icon name="bookOpen" size="xsmall" />}
						>
							Example link
						</Text>
					</Link>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="Button adornments">
				<Button endContent={<Kbd>⌘K</Kbd>} startContent={<Icon name="search" />}>
					Search
				</Button>
			</ComparisonItem>
		</Comparison>
	);
};
