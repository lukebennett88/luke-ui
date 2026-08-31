import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose>
			<Heading level={2}>Why structure matters</Heading>
			<Text elementType="p">
				Headings break a page into sections a reader can scan, paragraphs group related sentences,
				and lists set out steps or options one at a time.
			</Text>
			<Heading level={3}>Reading a list</Heading>
			<ol>
				<li>Scan the heading to see what the section covers.</li>
				<li>Read the paragraph for context.</li>
				<li>Follow the list for the details.</li>
			</ol>
		</Prose>
	);
};
