import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<h2>Why structure matters</h2>
			<p>
				Headings break a page into sections a reader can scan, paragraphs group related sentences,
				and lists set out steps or options one at a time.
			</p>
			<h3>Reading a list</h3>
			<ol>
				<li>Scan the heading to see what the section covers.</li>
				<li>Read the paragraph for context.</li>
				<li>Follow the list for the details.</li>
			</ol>
		</Prose>
	);
};
