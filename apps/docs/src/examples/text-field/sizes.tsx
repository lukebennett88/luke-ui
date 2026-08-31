import { Box } from '@luke-ui/react/box';
import { TextField } from '@luke-ui/react/text-field';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Box maxInlineSize="20rem">
			<Comparison direction="vertical">
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
		</Box>
	);
};
