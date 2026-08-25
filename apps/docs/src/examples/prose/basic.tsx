import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose>
			<Heading level={2}>Choosing a spacing scale</Heading>
			<Text elementType="p">
				A spacing scale trades range for consistency. Nine steps cover a component library without
				offering two values a designer cannot tell apart.
			</Text>
			<Heading level={3}>Picking a step</Heading>
			<Text elementType="p">Work outwards from the tightest gap the layout needs.</Text>
			<ol>
				<li>Measure the smallest gap in the design.</li>
				<li>Round it to the nearest step.</li>
				<li>Use that step everywhere the same relationship appears.</li>
			</ol>
		</Prose>
	);
};
