import { Box } from '@luke-ui/react/box';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';

export default () => {
	return (
		<HeadingLevels base={1}>
			<Box display="flex" flexDirection="column" gap="sp12">
				<Heading>Top-level heading (h1)</Heading>
				<HeadingLevels>
					<Heading>Nested heading (h2)</Heading>
					<HeadingLevels>
						<Heading>Nested again (h3)</Heading>
					</HeadingLevels>
				</HeadingLevels>
			</Box>
		</HeadingLevels>
	);
};
