import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<p>
				Links point to related content, such as the{' '}
				<a href="/components/actions/link">Link guide</a>. Inline code marks names like{' '}
				<code>className</code>, and keyboard input uses labels such as <kbd>Enter</kbd>.
			</p>
			<blockquote>
				<p>A blockquote separates quoted text from the surrounding paragraphs.</p>
			</blockquote>
		</Prose>
	);
};
