import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<HeadingLevels base={1}>
			<Stack gap="sp12">
				<Heading>Top-level heading (h1)</Heading>
				<HeadingLevels>
					<Heading>Nested heading (h2)</Heading>
					<HeadingLevels>
						<Heading>Nested again (h3)</Heading>
					</HeadingLevels>
				</HeadingLevels>
			</Stack>
		</HeadingLevels>
	);
};
