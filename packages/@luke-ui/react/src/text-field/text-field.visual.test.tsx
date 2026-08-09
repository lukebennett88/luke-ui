import { test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { Button } from '../button/index.js';
import { Icon } from '../icon/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';
import { TextField } from './index.js';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from './primitive/index.js';

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<TextField
					description="Small control size."
					label="Small"
					name="small"
					placeholder="Small"
					size="small"
				/>
				<TextField
					description="Medium control size."
					label="Medium"
					name="medium"
					placeholder="Medium"
					size="medium"
				/>
				<TextField label="Amount" name="amount" placeholder="0.00" prefix="$" />
				<TextField label="Total" name="total" placeholder="0.00" suffix="USD" />
				<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
				<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
				<TextField
					defaultValue="nope"
					errorMessage="Please enter a valid email."
					isInvalid
					label="Invalid"
					name="invalid"
				/>
				<TextField isInvalid label="Invalid, no message" name="invalid-no-message" />
				<TextField
					defaultValue="nope"
					errorMessage="Please enter a valid email."
					isInvalid
					label="Invalid small"
					name="invalid-small"
					size="small"
				/>
				<TextField
					defaultValue="0.00"
					errorMessage="Enter a valid amount."
					isInvalid
					label="Invalid with a suffix"
					name="invalid-suffix"
					placeholder="0.00"
					suffix="USD"
				/>
				<Stack width="14rem">
					<TextField
						label="Search"
						name="prefix-multiple-elements"
						placeholder="Search…"
						prefix={
							<>
								<Icon aria-hidden name="search" />
								<Icon aria-hidden name="check" />
							</>
						}
					/>
					<TextField
						label="Amount with icons"
						name="suffix-multiple-elements"
						placeholder="0.00"
						suffix={
							<>
								<Icon aria-hidden name="check" />
								<Icon aria-hidden name="close" />
							</>
						}
					/>
				</Stack>
				<Stack>
					<InputGroup>
						<InputGroupPrefix>$</InputGroupPrefix>
						<InputGroupInput aria-label="Amount" defaultValue="1250.00" inputMode="decimal" />
						<InputGroupSuffix>USD</InputGroupSuffix>
					</InputGroup>
					<InputGroup>
						<InputGroupInput aria-label="Workspace" defaultValue="acme" />
						<InputGroupSuffix>.luke-ui.dev</InputGroupSuffix>
					</InputGroup>
					<InputGroup>
						<InputGroupPrefix>
							<Icon aria-hidden name="search" />
						</InputGroupPrefix>
						<InputGroupInput aria-label="Search input group" defaultValue="invoices" />
						<InputGroupSuffix>
							<Button appearance="subtle" size="small">
								Clear
							</Button>
						</InputGroupSuffix>
					</InputGroup>
					<InputGroup isInvalid size="small">
						<InputGroupPrefix>$</InputGroupPrefix>
						<InputGroupInput aria-label="Refund" defaultValue="-1" inputMode="decimal" />
						<InputGroupSuffix>USD</InputGroupSuffix>
					</InputGroup>
				</Stack>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'text-field/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(<TextField label="Focus me" name="focus" placeholder="Type here" />);
	const input = page.getByRole('textbox', { name: 'Focus me' });

	await captureVisual(locator, 'text-field/resting');
	await userEvent.hover(input);
	await captureVisual(locator, 'text-field/hover');
	await userEvent.unhover(input);
	await focusViaKeyboard(input);
	await captureVisual(locator, 'text-field/focus-visible');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<TextField label="Interactive" name="interactive" placeholder="Type here" />
				<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
				<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
				<TextField
					defaultValue="nope"
					errorMessage="Please enter a valid email."
					isInvalid
					label="Invalid"
					name="invalid"
				/>
			</Stack>,
		);
		const input = page.getByRole('textbox', { name: 'Interactive' });

		await captureVisual(locator, 'text-field/forced-colors-resting-states');
		await userEvent.hover(input);
		await captureVisual(locator, 'text-field/forced-colors-hover');
		await userEvent.unhover(input);
		await focusViaKeyboard(input);
		await captureVisual(locator, 'text-field/forced-colors-focus-visible');
	} finally {
		await emulateForcedColors('none');
	}
});
