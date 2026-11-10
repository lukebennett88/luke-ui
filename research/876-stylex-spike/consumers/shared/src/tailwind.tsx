import { Box } from '#ui/box';
import { Button } from '#ui/button';
import { Text } from '#ui/text';

/**
 * Tailwind CSS 4 beside Luke UI. Preflight is in `base`, utilities in `utilities`, and the consumer
 * declares `@layer theme, base, luke-ui, components, utilities;` first.
 */
export default function TailwindApp() {
	return (
		<main className="p-6 flex flex-col gap-4">
			<Text className="tracking-wide" elementType="h1" typography="heading2">
				Tailwind consumer
			</Text>
			<Button data-testid="plain" prominence="high">
				Untouched
			</Button>
			<Button className="rounded-none" data-testid="override" prominence="high">
				Square via utility
			</Button>
			<Box className="bg-amber-200" data-testid="box-override" padding="space.16">
				A Box with a Tailwind background
			</Box>
		</main>
	);
}
