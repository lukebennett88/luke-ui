import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<ol>
				<li>Read the heading first.</li>
				<li>
					Read the paragraph that follows it.
					<ul>
						<li>Note any terms introduced there.</li>
						<li>Notice how it sets up the list below.</li>
					</ul>
				</li>
				<li>Work through the list in order.</li>
			</ol>
		</Prose>
	);
};
