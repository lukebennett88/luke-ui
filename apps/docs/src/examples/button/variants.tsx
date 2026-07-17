import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';

const appearances = ['solid', 'subtle', 'ghost'] as const;
const tones = ['neutral', 'accent', 'danger'] as const;

export default function Variants() {
	return (
		<Box display="grid" gap="300">
			{tones.map((tone) => (
				<Box alignItems="center" display="flex" flexWrap="wrap" gap="200" key={tone}>
					{appearances.map((appearance) => (
						<Button appearance={appearance} key={appearance} tone={tone}>
							{tone} {appearance}
						</Button>
					))}
				</Box>
			))}
		</Box>
	);
}
