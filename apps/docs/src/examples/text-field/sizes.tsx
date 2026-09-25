import { TextField } from '@luke-ui/react/text-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<TextField label="Example field" name="example" placeholder="Example input" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<TextField label="Example field" name="example" placeholder="Example input" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};
