import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<ol>
				<li>Prepare the release.</li>
				<li>
					Publish the packages.
					<ul>
						<li>Publish dependencies first.</li>
						<li>Publish the React package last.</li>
					</ul>
				</li>
				<li>Verify the release.</li>
			</ol>
		</Prose>
	);
};
