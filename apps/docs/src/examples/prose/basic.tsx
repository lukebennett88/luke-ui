import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<h2>Choosing a spacing scale</h2>
			<p>
				A spacing scale trades range for consistency. Nine steps cover a component library without
				offering two values a designer cannot tell apart.
			</p>
			<h3>Picking a step</h3>
			<p>Work outwards from the tightest gap the layout needs.</p>
			<ol>
				<li>Measure the smallest gap in the design.</li>
				<li>Round it to the nearest step.</li>
				<li>Use that step everywhere the same relationship appears.</li>
			</ol>
		</Prose>
	);
};
