import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neither rail">
				<Track gap="sp8">Example item</Track>
			</ComparisonItem>
			<ComparisonItem label="Start rail only">
				<Track gap="sp8" railStart={<Icon name="checkCircle" />}>
					Example item
				</Track>
			</ComparisonItem>
			<ComparisonItem label="End rail only">
				<Track gap="sp8" railEnd={<Button size="small">Undo</Button>}>
					Example item
				</Track>
			</ComparisonItem>
			<ComparisonItem label="Both rails">
				<Track
					gap="sp8"
					railEnd={<Button size="small">Undo</Button>}
					railStart={<Icon name="checkCircle" />}
				>
					Example item
				</Track>
			</ComparisonItem>
		</Comparison>
	);
};
