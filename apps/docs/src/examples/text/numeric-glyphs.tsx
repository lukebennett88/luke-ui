import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

const variants = [
	{ label: 'Tabular', sample: '111,111 888,888', value: 'tabular-nums' },
	{ label: 'Fractions', sample: '1/2 3/4 5/6', value: 'diagonal-fractions' },
	{ label: 'Ordinals', sample: '1st 2nd 3rd 4th', value: 'ordinal' },
	{ label: 'Slashed zero', sample: '012 OQR', value: 'slashed-zero' },
] as const;

export default () => {
	return (
		<Box
			display="grid"
			gap="400"
			inlineSize="100%"
			maxInlineSize="48rem"
			style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))' }}
		>
			{variants.map((variant) => (
				<Box display="grid" gap="200" key={variant.value}>
					<Text color="secondary" size="caption">
						{variant.label}
					</Text>
					<Text elementType="div" fontVariantNumeric={variant.value}>
						{variant.sample}
					</Text>
				</Box>
			))}
		</Box>
	);
};
