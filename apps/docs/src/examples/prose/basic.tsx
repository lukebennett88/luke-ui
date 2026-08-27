import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose>
<<<<<<< HEAD
			<h2>Why structure matters</h2>
			<p>
				Headings break a page into sections a reader can scan, paragraphs group related sentences,
				and lists set out steps or options one at a time.
			</p>
			<h3>Reading a list</h3>
=======
			<Heading level={2}>Before you start</Heading>
			<Text elementType="p">
				Make sure you have access to the project and its deployment environment.
			</Text>
			<Heading level={3}>Publish the release</Heading>
>>>>>>> 26f4ce3 (Scope typed ordered-list markers to Prose)
			<ol>
				<li>Scan the heading to see what the section covers.</li>
				<li>Read the paragraph for context.</li>
				<li>Follow the list for the details.</li>
			</ol>
		</Prose>
	);
};
