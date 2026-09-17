import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Start">
				<Track gap="sp8" railAlignment="start" railStart={<Icon name="checkCircle" />}>
					Example item with a second line of wrapped content
				</Track>
			</ComparisonItem>
			<ComparisonItem label="First line">
				<Track gap="sp8" railAlignment="firstLine" railStart={<Icon name="checkCircle" />}>
					Example item with a second line of wrapped content
				</Track>
			</ComparisonItem>
			<ComparisonItem label="Center">
				<Track gap="sp8" railAlignment="center" railStart={<Icon name="checkCircle" />}>
					Example item with a second line of wrapped content
				</Track>
			</ComparisonItem>
			<ComparisonItem label="End">
				<Track gap="sp8" railAlignment="end" railStart={<Icon name="checkCircle" />}>
					Example item with a second line of wrapped content
				</Track>
			</ComparisonItem>
		</Comparison>
	);
};
