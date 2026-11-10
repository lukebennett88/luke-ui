import { Box } from '#ui/box';
import { Text } from '#ui/text';

// #874 geometry cases for the StyleX Box. Each child opts in with `borderRadius="concentric"` and
// derives its corners from the nearest Box with geometry. Only the StyleX consumers build this app.
export default function Concentric() {
	return (
		<Box display="flex" flexDirection="column" gap="space.24" padding="space.24">
			<Text elementType="h1" typography="heading3">
				Concentric rounding
			</Text>
			<Box
				backgroundColor="surface.raised"
				borderRadius="overlay"
				data-testid="uniform"
				padding="space.12"
			>
				<Box
					backgroundColor="neutral.subtle"
					borderRadius="concentric"
					data-testid="uniform-child"
					padding="space.8"
				>
					<Box
						backgroundColor="accent.solid"
						borderRadius="concentric"
						data-testid="uniform-grandchild"
						padding="space.8"
					>
						Two levels
					</Box>
				</Box>
			</Box>
			<Box
				backgroundColor="surface.raised"
				borderRadius="overlay"
				borderColor="decorative"
				borderStyle="solid"
				borderWidth="thick"
				data-testid="asymmetric"
				paddingBlock="space.4"
				paddingInlineEnd="space.24"
				paddingInlineStart="space.8"
			>
				<Box
					backgroundColor="neutral.subtle"
					borderRadius="concentric"
					data-testid="asymmetric-child"
					padding="space.8"
				>
					Asymmetric insets and a border
				</Box>
			</Box>
			<div dir="rtl">
				<Box
					backgroundColor="surface.raised"
					borderRadius="overlay"
					data-testid="rtl"
					paddingInlineEnd="space.24"
					paddingInlineStart="space.8"
					paddingBlock="space.8"
				>
					<Box
						backgroundColor="neutral.subtle"
						borderRadius="concentric"
						data-testid="rtl-child"
						padding="space.8"
					>
						Right to left
					</Box>
				</Box>
			</div>
			<Box
				backgroundColor="surface.raised"
				borderRadius={{ initial: 'control', bp768: 'overlay' }}
				data-testid="responsive"
				padding={{ initial: 'space.4', bp768: 'space.12' }}
			>
				<Box
					backgroundColor="neutral.subtle"
					borderRadius="concentric"
					data-testid="responsive-child"
					padding="space.8"
				>
					Responsive radius and padding
				</Box>
			</Box>
			<Box
				backgroundColor="surface.raised"
				borderRadius="control"
				data-testid="clamped"
				padding="space.24"
			>
				<Box
					backgroundColor="neutral.subtle"
					borderRadius="concentric"
					data-testid="clamped-child"
					padding="space.8"
				>
					Radius smaller than the inset clamps to zero
				</Box>
			</Box>
			<Box
				backgroundColor="surface.raised"
				borderRadius="overlay"
				data-testid="wrapper"
				padding="space.12"
			>
				<Box display="flex" flexDirection="column">
					<Box
						backgroundColor="neutral.subtle"
						borderRadius="concentric"
						data-testid="wrapper-child"
						padding="space.8"
					>
						A Box without geometry passes the parent through
					</Box>
				</Box>
			</Box>
			<Box data-testid="responsive-only" padding={{ bp768: 'space.16' }}>
				Responsive value without an initial value
			</Box>
		</Box>
	);
}
