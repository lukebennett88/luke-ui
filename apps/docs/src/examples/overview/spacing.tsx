import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

type SpaceContractStep = `${keyof typeof vars.space}`;
const steps = [
	{ step: '100', value: '4px' },
	{ step: '200', value: '8px' },
	{ step: '300', value: '12px' },
	{ step: '400', value: '16px' },
	{ step: '600', value: '24px' },
	{ step: '800', value: '32px' },
	{ step: '1000', value: '40px' },
	{ step: '1200', value: '48px' },
	{ step: '1600', value: '64px' },
] as const satisfies ReadonlyArray<{ step: SpaceContractStep; value: string }>;

export default function SpacingExample() {
	return (
		<Box display="grid" gap="300">
			{steps.map(({ step, value }) => (
				<Box alignItems="center" display="flex" gap="300" key={step}>
					<Text
						color="secondary"
						elementType="span"
						fontWeight="label"
						size="200"
						style={{ inlineSize: '3rem' }}
					>
						{step}
					</Text>
					<Text color="secondary" elementType="span" size="200" style={{ inlineSize: '2.5rem' }}>
						{value}
					</Text>
					<Box
						style={{
							backgroundColor: vars.color.intent.accent.surface.solid,
							blockSize: '0.75rem',
							borderRadius: vars.radius.full,
							inlineSize: vars.space[step],
						}}
					/>
				</Box>
			))}
		</Box>
	);
}
