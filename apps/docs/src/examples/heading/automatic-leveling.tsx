import { Heading } from '@luke-ui/react/heading';
import { HeadingLevels } from '@luke-ui/react/heading-context';

export default function AutomaticLeveling() {
	return (
		<HeadingLevels base={1}>
			<Heading>Product roadmap</Heading>
			<HeadingLevels>
				<Heading>Objectives</Heading>
				<HeadingLevels>
					<Heading>First quarter</Heading>
				</HeadingLevels>
			</HeadingLevels>
		</HeadingLevels>
	);
}
