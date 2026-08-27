import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<h2>Before you start</h2>
			<p>Make sure you have access to the project and its deployment environment.</p>
			<h3>Publish the release</h3>
			<ol>
				<li>Tag the release.</li>
				<li>Publish the packages.</li>
				<li>Verify the deployment.</li>
			</ol>
		</Prose>
	);
};
