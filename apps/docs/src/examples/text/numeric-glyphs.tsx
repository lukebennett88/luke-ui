import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

const variants = [
	{ label: 'Tabular', sample: '111,111 888,888', value: 'tabular-nums' },
	{ label: 'Fractions', sample: '1/2 3/4 5/6', value: 'diagonal-fractions' },
	{ label: 'Ordinals', sample: '1st 2nd 3rd 4th', value: 'ordinal' },
	{ label: 'Slashed zero', sample: '012 OQR', value: 'slashed-zero' },
] as const;

export default () => {
	return (
		<Comparison>
			{variants.map((variant) => (
				<ComparisonItem key={variant.value} label={variant.label}>
					<Text elementType="div" fontVariantNumeric={variant.value}>
						{variant.sample}
					</Text>
				</ComparisonItem>
			))}
		</Comparison>
	);
};
