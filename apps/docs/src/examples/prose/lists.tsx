import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose>
			<Text elementType="p">Run the release in order.</Text>
			<ol>
				<li>Tag the commit.</li>
				<li>
					Publish each package.
					<ul>
						<li>Check the changelog first.</li>
						<li>Publish the theme packages last.</li>
					</ul>
				</li>
				<li>Announce the release.</li>
			</ol>
		</Prose>
	);
};
