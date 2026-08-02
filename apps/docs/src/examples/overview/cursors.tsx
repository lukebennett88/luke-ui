import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Code } from '@luke-ui/react/code';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import type { ReactNode } from 'react';

interface CursorSample {
	control: ReactNode;
	cursor: string;
	label: string;
}

const cursorSamples: Array<CursorSample> = [
	{ control: <Button>Save</Button>, cursor: 'pointer', label: 'Button' },
	{ control: <Button isDisabled>Save</Button>, cursor: 'not-allowed', label: 'Disabled button' },
	{ control: <Button isPending>Save</Button>, cursor: 'wait', label: 'Pending button' },
	{ control: <Link href="#">Read more</Link>, cursor: 'pointer', label: 'Link' },
	{
		control: (
			<Link href="#" isDisabled>
				Read more
			</Link>
		),
		cursor: 'not-allowed',
		label: 'Disabled link',
	},
	{ control: <Checkbox>Subscribe</Checkbox>, cursor: 'pointer', label: 'Checkbox' },
	{
		control: <Checkbox isDisabled>Subscribe</Checkbox>,
		cursor: 'not-allowed',
		label: 'Disabled checkbox',
	},
	{
		control: (
			<Checkbox isReadOnly isSelected>
				Subscribe
			</Checkbox>
		),
		cursor: 'default',
		label: 'Read-only checkbox',
	},
	{
		control: <TextField aria-label="Name" placeholder="Ada Lovelace" />,
		cursor: 'text',
		label: 'Text field',
	},
	{
		control: <TextField aria-label="Name" isDisabled placeholder="Ada Lovelace" />,
		cursor: 'not-allowed',
		label: 'Disabled text field',
	},
];

export default function CursorsExample() {
	return (
		<Box
			display="grid"
			gap="600"
			style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', inlineSize: '100%' }}
		>
			{cursorSamples.map((sample) => (
				<Box display="grid" gap="200" key={sample.label}>
					<Text size="100" style={{ textAlign: 'center' }}>
						{sample.label}
					</Text>
					<Box
						alignItems="center"
						display="flex"
						justifyContent="center"
						style={{ minBlockSize: '2.5rem' }}
					>
						{sample.control}
					</Box>
					<Code style={{ textAlign: 'center' }}>cursor: {sample.cursor}</Code>
				</Box>
			))}
		</Box>
	);
}
