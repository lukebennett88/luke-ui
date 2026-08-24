import { Box } from '@luke-ui/react/box';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';

export default () => {
	return (
		<HeadingLevels base={1}>
			<Box display="flex" flexDirection="column" gap="sp12">
				<Heading>Product roadmap</Heading>
				<HeadingLevels>
					<Heading>Objectives</Heading>
					<HeadingLevels>
						<Heading>First quarter</Heading>
					</HeadingLevels>
				</HeadingLevels>
			</Box>
		</HeadingLevels>
	);
};
