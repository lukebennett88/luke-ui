import { Heading } from '@luke-ui/react/heading';
import { HeadingLevels } from '@luke-ui/react/heading-context';

export default function AutomaticLeveling() {
	return (
		<HeadingLevels base={1}>
			<Heading>h1</Heading>
			<HeadingLevels>
				<Heading>h2 nested automatically</Heading>
				<HeadingLevels>
					<Heading>h3 nested again</Heading>
				</HeadingLevels>
			</HeadingLevels>
		</HeadingLevels>
	);
}
