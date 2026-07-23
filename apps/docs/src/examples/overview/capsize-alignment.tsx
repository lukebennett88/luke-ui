import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function CapsizeAlignmentExample() {
	return (
		<Box display="grid" gap="600">
			<TrimExample isTrimmed />
			<TrimExample isTrimmed={false} />
			<Box
				alignItems="baseline"
				display="flex"
				flexWrap="wrap"
				gap="300"
				style={{ borderBlockEnd: `1px solid ${vars.color.border.decorative}` }}
			>
				<Text color="secondary" elementType="span" size="200">
					Small text
				</Text>
				<Text elementType="span" fontWeight="heading" size="700">
					Large text
				</Text>
			</Box>
		</Box>
	);
}

function TrimExample({ isTrimmed }: { isTrimmed: boolean }) {
	return (
		<Box display="grid" gap="200">
			<Text color="secondary" elementType="span" fontWeight="label" size="200">
				{isTrimmed ? 'Trimmed' : 'Untrimmed'}
			</Text>
			<Box
				style={{
					borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
					borderBlockStart: `1px solid ${vars.color.border.decorative}`,
				}}
			>
				<Text elementType="span" fontWeight="heading" shouldDisableTrim={!isTrimmed} size="700">
					Ag 012
				</Text>
			</Box>
		</Box>
	);
}
