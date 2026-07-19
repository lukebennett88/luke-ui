import { Button } from '@luke-ui/react/button';
import {
	Dialog,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@luke-ui/react/dialog';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Dialog,
	tags: ['actions'],
	title: 'Actions/Dialog',
});

/**
 * A basic dialog with header, description, and action buttons.
 */
export const Default = meta.story({
	render: () => (
		<DialogTrigger>
			<Button>Open Dialog</Button>
			<Dialog>
				<DialogHeader>
					<DialogTitle>Confirm action</DialogTitle>
					<DialogDescription>
						Are you sure you want to proceed with this action? This cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button appearance="subtle">Cancel</Button>
					<Button tone="accent">Confirm</Button>
				</DialogFooter>
			</Dialog>
		</DialogTrigger>
	),
	play: async ({ canvas, step }) => {
		const trigger = canvas.getByRole('button', { name: 'Open Dialog' });

		await step('opens the dialog on trigger press', async () => {
			await userEvent.click(trigger);
			const dialog = await waitFor(() => canvas.getByRole('dialog'));
			await expect(dialog).toBeVisible();
			await expect(canvas.getByText('Confirm action')).toBeVisible();
		});

		await step('closes the dialog via the X button', async () => {
			const closeButton = canvas.getByRole('button', { name: 'Close' });
			await userEvent.click(closeButton);
			await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
		});
	},
});

/**
 * A dialog without the close button, useful for mandatory choices.
 */
export const WithoutCloseButton = meta.story({
	render: () => (
		<DialogTrigger>
			<Button>Open Dialog</Button>
			<Dialog showCloseButton={false}>
				<DialogTitle>Choose an option</DialogTitle>
				<DialogDescription>
					You must select one of the available options to continue.
				</DialogDescription>
				<DialogFooter>
					<Button appearance="subtle">Option A</Button>
					<Button tone="accent">Option B</Button>
				</DialogFooter>
			</Dialog>
		</DialogTrigger>
	),
	play: async ({ canvas, step }) => {
		const trigger = canvas.getByRole('button', { name: 'Open Dialog' });

		await step('opens the dialog without a close button', async () => {
			await userEvent.click(trigger);
			const dialog = await waitFor(() => canvas.getByRole('dialog'));
			await expect(dialog).toBeVisible();
			await expect(canvas.queryByRole('button', { name: 'Close' })).toBeNull();
		});
	},
});

/**
 * A dialog with a close button in the footer.
 */
export const WithFooterClose = meta.story({
	render: () => (
		<DialogTrigger>
			<Button>Open Dialog</Button>
			<Dialog>
				<DialogHeader>
					<DialogTitle>Terms and conditions</DialogTitle>
					<DialogDescription>
						Please review and accept the terms before continuing.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton>
					<Button tone="accent">Accept</Button>
				</DialogFooter>
			</Dialog>
		</DialogTrigger>
	),
	play: async ({ canvas, step }) => {
		const trigger = canvas.getByRole('button', { name: 'Open Dialog' });

		await step('opens and closes via footer button', async () => {
			await userEvent.click(trigger);
			await waitFor(() => expect(canvas.getByRole('dialog')).toBeVisible());

			const footerClose = canvas.getByRole('button', { name: 'Close' });
			await userEvent.click(footerClose);
			await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
		});
	},
});

/**
 * A non-dismissable dialog that requires explicit action.
 */
export const NonDismissable = meta.story({
	render: () => (
		<DialogTrigger>
			<Button>Open Dialog</Button>
			<Dialog isDismissable={false}>
				<DialogTitle>Required action</DialogTitle>
				<DialogDescription>
					This dialog cannot be closed by clicking outside or pressing Escape.
				</DialogDescription>
				<DialogFooter>
					<Button tone="accent">Continue</Button>
				</DialogFooter>
			</Dialog>
		</DialogTrigger>
	),
});
