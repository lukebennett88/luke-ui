import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<ol>
				<li>An ordered list numbers each item, so the order carries meaning.</li>
				<li>
					An item can hold a nested list of its own.
					<ul>
						<li>A nested list is indented from its parent item.</li>
						<li>An unordered list marks items with bullets instead of numbers.</li>
					</ul>
				</li>
				<li>Spacing between items stays even at every level.</li>
			</ol>
		</Prose>
	);
};
