import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Solid">
				<IconButton appearance="solid" aria-label="Example action" icon="bookOpen" />
			</ComparisonItem>
			<ComparisonItem label="Subtle">
				<IconButton appearance="subtle" aria-label="Example action" icon="bookOpen" />
			</ComparisonItem>
			<ComparisonItem label="Ghost">
				<IconButton appearance="ghost" aria-label="Example action" icon="bookOpen" />
			</ComparisonItem>
		</Comparison>
	);
};
