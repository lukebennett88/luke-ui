import { Stack } from '@luke-ui/react/stack';
import { TextField } from '@luke-ui/react/text-field';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Stack maxInlineSize="20rem">
			<Comparison>
				<ComparisonItem label="Small">
					<TextField
						label="Example field"
						name="example"
						placeholder="Example input"
						size="small"
					/>
				</ComparisonItem>
				<ComparisonItem label="Medium">
					<TextField
						label="Example field"
						name="example"
						placeholder="Example input"
						size="medium"
					/>
				</ComparisonItem>
			</Comparison>
		</Stack>
	);
};
