import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { HeadingLevels } from '@luke-ui/react/heading-context';

export default () => {
	return (
		<HeadingLevels base={1}>
			<Box display="flex" flexDirection="column" gap="300">
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
