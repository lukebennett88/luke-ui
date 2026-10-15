import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

const content = (
	<Stack gap="sp8">
		<Heading level={2}>Section title</Heading>
		<Text>Description in body text below a larger title</Text>
	</Stack>
);

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Spike: firstBaseline, body context">
				<Box maxInlineSize="16rem">
					<Track gap="sp8" railAlignment="firstBaseline" railStart={<Icon name="bookOpen" />}>
						{content}
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Spike: firstBaseline, heading2 context">
				<Box maxInlineSize="16rem">
					<Text elementType="div" shouldDisableTrim typography="heading2">
						<Track gap="sp8" railAlignment="firstBaseline" railStart={<Icon name="bookOpen" />}>
							{content}
						</Track>
					</Text>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
