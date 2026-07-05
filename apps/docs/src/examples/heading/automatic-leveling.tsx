import { Heading } from '@luke-ui/react/heading';
import { HeadingLevels } from '@luke-ui/react/heading-context';
import type { JSX } from 'react';

export const meta = {
	title: 'Heading — Automatic leveling',
	description: 'Heading levels are inferred from nested HeadingLevels context.',
};

export default function AutomaticLeveling(): JSX.Element {
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
