import { Button } from '@luke-ui/react/button';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Stack alignItems="flex-start" gap="sp12">
			<Text color="secondary" elementType="p" typography="caption">
				Focus the button, then press Tab to reveal the skip link.
			</Text>
			<Button>Example button</Button>
			<VisuallyHidden
				isFocusable
				renderRoot={(domProps) => (
					<Link {...domProps} href="#example-main">
						Skip to main content
					</Link>
				)}
			/>
			<ExampleItem elementType="main" id="example-main" inlineSize="100%" tabIndex={-1}>
				Main content
			</ExampleItem>
		</Stack>
	);
};
