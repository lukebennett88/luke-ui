import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose>
			<h2>Choosing a type style</h2>
			<Text elementType="p" typography="lead">
				A lead paragraph uses Text to step up from the body style.
			</Text>
			<p>The paragraphs after it stay plain and use the body style.</p>
		</Prose>
	);
};
