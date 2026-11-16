import { Button } from '@luke-ui/react/button';
import { Dialog } from '@luke-ui/react/dialog';
import { Form } from '@luke-ui/react/form';
import { Heading } from '@luke-ui/react/heading';
import {
	DialogContent,
	DialogOverlay,
	DialogSurface,
	DialogTrigger,
} from '@luke-ui/react/primitives/dialog';
import { Text } from '@luke-ui/react/text';
import type { ComponentProps } from 'react';
import { createRef, useState, useTransition } from 'react';
import { afterEach, expect, onTestFinished, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { emulateForcedColors, emulateReducedMotion } from '../test-utils/emulate-media.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance } from '../test-utils/visual.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

const observers: Array<MutationObserver> = [];

afterEach(async () => {
	for (const observer of observers) observer.disconnect();
	observers.length = 0;
	await emulateReducedMotion(false);
	await emulateForcedColors('none');
	await page.viewport(1024, 800);
});

function ControlledDialog(props: Partial<ComponentProps<typeof Dialog>>) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button onPress={() => setIsOpen(true)}>Open dialog</Button>
			<Dialog
				description="Review the details before you continue."
				onOpenChange={setIsOpen}
				title="Example dialog"
				{...props}
				isOpen={isOpen}
			>
				<Button slot="close">Close</Button>
			</Dialog>
		</>
	);
}

function PendingCloseDialog({ gate }: { gate: Promise<void> }) {
	const [isPending, startTransition] = useTransition();

	return (
		<DialogTrigger>
			<Button>Open pending</Button>
			<Dialog title="Pending dialog">
				{({ close }) => (
					<Button
						isPending={isPending}
						onPress={() => {
							startTransition(async () => {
								await gate;
								close();
							});
						}}
					>
						Save
					</Button>
				)}
			</Dialog>
		</DialogTrigger>
	);
}

/** Records the description reference the dialog carries when it first receives focus. */
function recordDialogFocusDescription(): { describedBy: Array<string | null> } {
	const recorded: { describedBy: Array<string | null> } = { describedBy: [] };
	const listener = (event: FocusEvent) => {
		const role = event.target instanceof HTMLElement ? event.target.getAttribute('role') : null;
		if (event.target instanceof HTMLElement && (role === 'dialog' || role === 'alertdialog')) {
			recorded.describedBy.push(event.target.getAttribute('aria-describedby'));
		}
	};
	document.addEventListener('focusin', listener);
	onTestFinished(() => {
		document.removeEventListener('focusin', listener);
	});
	return recorded;
}

function dialogElement(name: string | RegExp = 'Example dialog'): HTMLElement {
	const dialog = page.getByRole('dialog', { name }).element();
	if (!(dialog instanceof HTMLElement)) throw new Error('Expected an HTML dialog element.');
	return dialog;
}

function overlayOf(dialog: Element): HTMLElement {
	const overlay = dialog.parentElement?.parentElement;
	if (overlay == null) throw new Error('Expected the dialog to sit in a surface and an overlay.');
	return overlay;
}

/** Opens the controlled example and resolves with its dialog once it has settled. */
async function openControlled(): Promise<HTMLElement> {
	await userEvent.click(page.getByRole('button', { name: 'Open dialog' }));
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));
	return dialog;
}

async function pressBackdrop(dialog: Element) {
	// A press near the corner lands on the overlay, outside the centred surface.
	await page.elementLocator(overlayOf(dialog)).click({ position: { x: 5, y: 5 } });
}

function resolveBackground(value: string): string {
	const probe = document.body.appendChild(document.createElement('div'));
	probe.style.backgroundColor = value;
	const resolved = getComputedStyle(probe).backgroundColor;
	probe.remove();
	return resolved;
}

test('renders nothing while closed', () => {
	render(
		<Dialog isOpen={false} onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			Body
		</Dialog>,
	);

	expect(page.getByRole('dialog').elements()).toHaveLength(0);
	expect(document.body).not.toHaveTextContent('Example dialog');
});

test('names the dialog with its title and describes it with its description', async () => {
	render(
		<Dialog
			description="Review the details before you continue."
			isOpen
			onOpenChange={vi.fn<(isOpen: boolean) => void>()}
			title="Example dialog"
		>
			Body
		</Dialog>,
	);

	const dialog = page.getByRole('dialog', { name: 'Example dialog' });
	await expect
		.element(dialog)
		.toHaveAccessibleDescription('Review the details before you continue.');
});

test('uses the alertdialog role and still describes it', async () => {
	render(
		<Dialog
			description="This cannot be undone."
			isOpen
			onOpenChange={vi.fn<(isOpen: boolean) => void>()}
			role="alertdialog"
			title="Clear data"
		>
			Body
		</Dialog>,
	);

	const dialog = page.getByRole('alertdialog', { name: 'Clear data' });
	await expect.element(dialog).toHaveAccessibleDescription('This cannot be undone.');
	expect(page.getByRole('dialog').elements()).toHaveLength(0);
});

test('adds no description reference without a description', async () => {
	render(
		<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			Body
		</Dialog>,
	);

	const dialog = page.getByRole('dialog', { name: 'Example dialog' });
	await expect.element(dialog).toBeVisible();
	expect(dialog.element()).not.toHaveAttribute('aria-describedby');
});

for (const role of ['dialog', 'alertdialog'] as const) {
	test(`follows a description added and removed while the ${role} stays open`, async () => {
		const onOpenChange = vi.fn<(isOpen: boolean) => void>();
		const { rerender } = render(
			<Dialog isOpen onOpenChange={onOpenChange} role={role} title="Example dialog">
				Body
			</Dialog>,
		);
		const dialog = page.getByRole(role, { name: 'Example dialog' });
		await expect.element(dialog).toBeVisible();

		rerender(
			<Dialog
				description="Added description"
				isOpen
				onOpenChange={onOpenChange}
				role={role}
				title="Example dialog"
			>
				Body
			</Dialog>,
		);
		await expect.element(dialog).toHaveAccessibleDescription('Added description');

		rerender(
			<Dialog isOpen onOpenChange={onOpenChange} role={role} title="Example dialog">
				Body
			</Dialog>,
		);
		await expect.element(dialog).not.toHaveAttribute('aria-describedby');
		await expect.element(dialog).toHaveAccessibleDescription('');
	});
}

test('forwards id, className, style, and ref to the dialog element', async () => {
	const ref = createRef<HTMLElement>();
	render(
		<Dialog
			className="custom-dialog"
			id="custom-dialog-id"
			isOpen
			onOpenChange={vi.fn<(isOpen: boolean) => void>()}
			ref={ref}
			style={{ letterSpacing: '3px' }}
			title="Example dialog"
		>
			Body
		</Dialog>,
	);

	const dialog = dialogElement();

	expect(dialog).toHaveAttribute('id', 'custom-dialog-id');
	expect(dialog).toHaveClass('custom-dialog');
	expect(dialog.style.letterSpacing).toBe('3px');
	expect(ref.current).toBe(dialog);
});

test('moves focus into the dialog on open and back to the opener on close', async () => {
	render(<ControlledDialog />);
	const opener = page.getByRole('button', { name: 'Open dialog' });

	const dialog = await openControlled();
	expect(dialog.contains(document.activeElement)).toBe(true);

	await userEvent.click(page.getByRole('button', { name: 'Close' }));
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(opener).toHaveFocus();
});

test('a close button asks to close and the dialog stays open until the parent changes isOpen', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog isOpen onOpenChange={onOpenChange} title="Example dialog">
			<Button slot="close">Close</Button>
		</Dialog>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Close' }));

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	await expect.element(page.getByRole('dialog', { name: 'Example dialog' })).toBeVisible();
});

test('Escape asks to close', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog isOpen onOpenChange={onOpenChange} title="Example dialog">
			Body
		</Dialog>,
	);
	await waitForOverlayEnter(overlayOf(dialogElement()));

	await userEvent.keyboard('{Escape}');

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('isKeyboardDismissDisabled blocks Escape', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog
			isDismissable
			isKeyboardDismissDisabled
			isOpen
			onOpenChange={onOpenChange}
			title="Example dialog"
		>
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	await userEvent.keyboard('{Escape}');
	// Pointer events run in order, so the backdrop call is the only one if Escape did nothing.
	await pressBackdrop(dialog);

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('a press outside the dialog closes it only when isDismissable is set', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	const { rerender } = render(
		<Dialog isOpen onOpenChange={onOpenChange} title="Example dialog">
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	await pressBackdrop(dialog);
	expect(onOpenChange).not.toHaveBeenCalled();

	rerender(
		<Dialog isDismissable isOpen onOpenChange={onOpenChange} title="Example dialog">
			Body
		</Dialog>,
	);
	await pressBackdrop(dialog);

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('a press inside the dialog is not an outside press', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog isDismissable isOpen onOpenChange={onOpenChange} title="Example dialog">
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	await userEvent.click(page.getByRole('heading', { name: 'Example dialog' }));
	await userEvent.keyboard('{Escape}');

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('Buttons inside the dialog use the medium size instead of the surrounding Form size', async () => {
	render(
		<Form controlSize="small">
			<Button>Outside</Button>
			<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
				<Button>Inside</Button>
			</Dialog>
		</Form>,
	);
	await waitForOverlayEnter(overlayOf(dialogElement()));

	const height = (name: string) => {
		return page.getByRole('button', { name }).element().getBoundingClientRect().height;
	};

	expect(height('Outside')).toBe(32);
	expect(height('Inside')).toBe(40);
});

test('controls inside the primitives inherit the surrounding Form size', async () => {
	render(
		<Form controlSize="small">
			<DialogOverlay isOpen>
				<DialogSurface>
					<DialogContent aria-label="Primitive">
						<Button>Inside</Button>
					</DialogContent>
				</DialogSurface>
			</DialogOverlay>
		</Form>,
	);
	await waitForOverlayEnter(overlayOf(dialogElement('Primitive')));

	expect(
		page.getByRole('button', { name: 'Inside' }).element().getBoundingClientRect().height,
	).toBe(32);
});

test('the surface keeps a visible border in forced colours', async () => {
	await emulateForcedColors('active');
	render(
		<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	const surface = getComputedStyle(dialog.parentElement as HTMLElement);

	expect(surface.borderTopStyle).toBe('solid');
	expect(surface.borderTopWidth).not.toBe('0px');
	expect(surface.borderTopColor).toBe(resolveBackground('CanvasText'));
});

test('the surface transitions only opacity under reduced motion', async () => {
	await emulateReducedMotion(true);
	render(
		<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	const surface = getComputedStyle(dialog.parentElement as HTMLElement);

	expect(surface.transitionProperty).toBe('opacity');
	expect(surface.translate).toBe('none');
});

test('the surface fits a narrow viewport and scrolls tall content', async () => {
	await page.viewport(320, 480);
	render(
		<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			<div style={{ blockSize: '1200px' }}>Tall content</div>
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	const surface = dialog.parentElement as HTMLElement;
	const box = surface.getBoundingClientRect();

	expect(box.top).toBeGreaterThanOrEqual(0);
	expect(box.left).toBeGreaterThanOrEqual(0);
	expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
	expect(box.right).toBeLessThanOrEqual(window.innerWidth);
	expect(surface.scrollHeight).toBeGreaterThan(surface.clientHeight);
});

test('the surface paints the document raised colour in dark mode from its first frame', async () => {
	const firstFrames: Array<string> = [];
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				const dialog = node.querySelector('[role="dialog"]');
				if (dialog?.parentElement) {
					firstFrames.push(getComputedStyle(dialog.parentElement).backgroundColor);
				}
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
	observers.push(observer);
	render(
		<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			Body
		</Dialog>,
		{ appearance: { mode: 'dark', theme: 'tactile' } },
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	const expected = resolveBackground(
		getComputedStyle(document.documentElement).getPropertyValue(
			'--luke-color-background-surface-raised',
		),
	);

	expect(getComputedStyle(dialog.parentElement as HTMLElement).backgroundColor).toBe(expected);
	expect(firstFrames[0]).toBe(expected);
});

for (const role of ['dialog', 'alertdialog'] as const) {
	test(`has no axe violations open as a ${role}`, async () => {
		render(
			<Dialog
				description="Review the details before you continue."
				isOpen
				onOpenChange={vi.fn<(isOpen: boolean) => void>()}
				role={role}
				showCloseButton
				title="Example dialog"
			>
				<Button slot="close">Cancel</Button>
			</Dialog>,
		);
		await waitForOverlayEnter(overlayOf(page.getByRole(role).element()));

		await expectNoAxeViolations(document.body);
	});
}

test('DialogTrigger opens a primitive dialog that names, describes, and closes itself', async () => {
	render(
		<DialogTrigger>
			<Button>Open primitive</Button>
			<DialogOverlay>
				<DialogSurface>
					<DialogContent aria-describedby="primitive-description">
						<Heading level={2} slot="title">
							Primitive title
						</Heading>
						<Text elementType="p" id="primitive-description">
							Primitive description
						</Text>
						<Button slot="close">Done</Button>
					</DialogContent>
				</DialogSurface>
			</DialogOverlay>
		</DialogTrigger>,
	);
	const trigger = page.getByRole('button', { name: 'Open primitive' });

	await userEvent.click(trigger);
	const dialog = page.getByRole('dialog', { name: 'Primitive title' });
	await expect.element(dialog).toHaveAccessibleDescription('Primitive description');
	await waitForOverlayEnter(overlayOf(dialog.element()));

	await userEvent.click(page.getByRole('button', { name: 'Done' }));
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('shows no close button by default', async () => {
	render(
		<Dialog isOpen onOpenChange={vi.fn<(isOpen: boolean) => void>()} title="Example dialog">
			Body
		</Dialog>,
	);
	await expect.element(page.getByRole('dialog', { name: 'Example dialog' })).toBeVisible();

	await expect.element(page.getByRole('button', { name: 'Close' })).not.toBeInTheDocument();
});

test('the close button follows the title, is the first Tab stop, and closes the dialog from the keyboard', async () => {
	render(
		<DialogTrigger>
			<Button>Open dialog</Button>
			<Dialog showCloseButton title="Example dialog">
				<Button>Save</Button>
			</Dialog>
		</DialogTrigger>,
	);
	const trigger = page.getByRole('button', { name: 'Open dialog' });

	await userEvent.click(trigger);
	const dialog = page.getByRole('dialog', { name: 'Example dialog' });
	await expect.element(dialog).toHaveFocus();
	await waitForOverlayEnter(overlayOf(dialog.element()));
	const heading = page.getByRole('heading', { name: 'Example dialog' }).element();
	const closeButton = page.getByRole('button', { name: 'Close' });
	expect(
		heading.compareDocumentPosition(closeButton.element()) & Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();

	await userEvent.tab();
	await expect.element(closeButton).toHaveFocus();
	await userEvent.keyboard('{Enter}');

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('the close button does not move the title or the description', async () => {
	async function measure(showCloseButton: boolean) {
		const view = render(
			<Dialog
				description="Review the details before you continue."
				isOpen
				onOpenChange={vi.fn<(isOpen: boolean) => void>()}
				showCloseButton={showCloseButton}
				title="Example dialog"
			>
				Body
			</Dialog>,
		);
		await expect.element(page.getByRole('dialog', { name: 'Example dialog' })).toBeVisible();
		const dialogTop = dialogElement().getBoundingClientRect().top;
		const title = page.getByRole('heading', { name: 'Example dialog' }).element();
		const description = page.getByText('Review the details before you continue.').element();
		const offsets = {
			description: description.getBoundingClientRect().top - dialogTop,
			title: title.getBoundingClientRect().top - dialogTop,
		};
		view.unmount();
		return offsets;
	}

	const withoutCloseButton = await measure(false);
	const withCloseButton = await measure(true);

	// The trimmed title and the font's own cap height can differ by a fraction of a pixel.
	expect(Math.abs(withCloseButton.title - withoutCloseButton.title)).toBeLessThan(1);
	expect(Math.abs(withCloseButton.description - withoutCloseButton.description)).toBeLessThan(1);
});

test('pressing the close button asks a controlled dialog to close', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog isOpen onOpenChange={onOpenChange} showCloseButton title="Example dialog">
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	await userEvent.click(page.getByRole('button', { name: 'Close' }));

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('isCloseButtonDisabled disables only the close button', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog
			isCloseButtonDisabled
			isOpen
			onOpenChange={onOpenChange}
			showCloseButton
			title="Example dialog"
		>
			<Button>Save</Button>
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));
	const closeButton = page.getByRole('button', { name: 'Close' });

	await expect.element(closeButton).toBeDisabled();
	await userEvent.click(closeButton, { force: true });
	expect(onOpenChange).not.toHaveBeenCalled();

	await userEvent.tab();
	await expect.element(page.getByRole('button', { name: 'Save' })).toHaveFocus();

	await userEvent.keyboard('{Escape}');
	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('isKeyboardDismissDisabled leaves the close button enabled', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<Dialog
			isKeyboardDismissDisabled
			isOpen
			onOpenChange={onOpenChange}
			showCloseButton
			title="Example dialog"
		>
			Body
		</Dialog>,
	);
	const dialog = dialogElement();
	await waitForOverlayEnter(overlayOf(dialog));

	await userEvent.keyboard('{Escape}');
	expect(onOpenChange).not.toHaveBeenCalled();

	await userEvent.click(page.getByRole('button', { name: 'Close' }));
	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
});

test('a composed Dialog opens from its trigger, closes with a close button, and restores focus', async () => {
	const warn = vi.spyOn(console, 'warn');
	onTestFinished(() => {
		warn.mockRestore();
	});
	render(
		<DialogTrigger>
			<Button>Open composed</Button>
			<Dialog description="Composed description" title="Composed dialog">
				<Button slot="close">Done</Button>
			</Dialog>
		</DialogTrigger>,
	);
	const trigger = page.getByRole('button', { name: 'Open composed' });
	const triggerElement = trigger.element();
	expect(triggerElement).toHaveAttribute('aria-expanded', 'false');

	await userEvent.click(trigger);
	const dialog = page.getByRole('dialog', { name: 'Composed dialog' });
	await expect.element(dialog).toHaveAccessibleDescription('Composed description');
	expect(triggerElement).toHaveAttribute('aria-expanded', 'true');
	await waitForOverlayEnter(overlayOf(dialog.element()));

	await userEvent.click(page.getByRole('button', { name: 'Done' }));
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(page.elementLocator(triggerElement)).toHaveFocus();
	expect(triggerElement).toHaveAttribute('aria-expanded', 'false');
	expect(warn).not.toHaveBeenCalledWith(
		expect.stringContaining('state is controlled by a trigger'),
	);
});

test('a trigger that controls the open state receives Escape and keeps the dialog open when it ignores it', async () => {
	const onOpenChange = vi.fn<(isOpen: boolean) => void>();
	render(
		<DialogTrigger isOpen onOpenChange={onOpenChange}>
			<Button>Open controlled</Button>
			<Dialog title="Controlled dialog">Body</Dialog>
		</DialogTrigger>,
	);
	const dialog = page.getByRole('dialog', { name: 'Controlled dialog' });
	await waitForOverlayEnter(overlayOf(dialog.element()));

	await userEvent.keyboard('{Escape}');

	expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	await expect.element(dialog).toBeVisible();
});

test('render-function children close the dialog after an async action and Button shows pending', async () => {
	let release: (() => void) | undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	onTestFinished(() => {
		release?.();
	});
	render(<PendingCloseDialog gate={gate} />);
	const trigger = page.getByRole('button', { name: 'Open pending' });
	const triggerElement = trigger.element();

	await userEvent.click(trigger);
	const dialog = page.getByRole('dialog', { name: 'Pending dialog' });
	await waitForOverlayEnter(overlayOf(dialog.element()));
	const save = page.getByRole('button', { name: 'Save' });
	await userEvent.click(save);

	await expect.poll(() => save.element().getAttribute('data-pending')).toBe('true');
	await expect.element(dialog).toBeVisible();

	if (release === undefined) throw new Error('Expected the gate to be set.');
	release();
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(page.elementLocator(triggerElement)).toHaveFocus();
});

test('announces only the description, not longer content in children', async () => {
	render(
		<Dialog
			description="Short description"
			isOpen
			onOpenChange={vi.fn<(isOpen: boolean) => void>()}
			title="Example dialog"
		>
			<Text elementType="p">First paragraph</Text>
			<Text elementType="p">Second paragraph</Text>
		</Dialog>,
	);

	await expect
		.element(page.getByRole('dialog', { name: 'Example dialog' }))
		.toHaveAccessibleDescription('Short description');
});

test('a composed Dialog carries its description reference when it first takes focus', async () => {
	const recorded = recordDialogFocusDescription();
	render(
		<DialogTrigger>
			<Button>Open composed</Button>
			<Dialog description="Composed description" title="Composed dialog">
				Body
			</Dialog>
		</DialogTrigger>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Open composed' }));
	const dialog = page.getByRole('dialog', { name: 'Composed dialog' });
	await expect.element(dialog).toHaveFocus();

	const description = recorded.describedBy[0];
	expect(description).toBeTruthy();
	expect(dialog.element().querySelector(`[id="${description}"]`)).toHaveTextContent(
		'Composed description',
	);
});

test('DialogContent keeps the alertdialog description slot beside its title slot from first focus', async () => {
	const recorded = recordDialogFocusDescription();
	render(
		<DialogTrigger>
			<Button>Open primitive</Button>
			<DialogOverlay>
				<DialogSurface>
					<DialogContent role="alertdialog">
						<Heading level={2} slot="title">
							Primitive title
						</Heading>
						<Text elementType="p" slot="description">
							Primitive description
						</Text>
					</DialogContent>
				</DialogSurface>
			</DialogOverlay>
		</DialogTrigger>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Open primitive' }));
	const dialog = page.getByRole('alertdialog', { name: 'Primitive title' });
	await expect.element(dialog).toHaveFocus();

	const description = recorded.describedBy[0];
	expect(description).toBeTruthy();
	expect(dialog.element().querySelector(`[id="${description}"]`)).toHaveTextContent(
		'Primitive description',
	);
});

test('primitive class names are appended to the Luke UI classes', async () => {
	let overlayState: { isEntering: boolean; isExiting: boolean } | undefined;
	let surfaceState: { isEntering: boolean; isExiting: boolean } | undefined;
	render(
		<DialogOverlay
			className={(state) => {
				overlayState = state;
				return 'custom-overlay';
			}}
			isOpen
		>
			<DialogSurface
				className={(state) => {
					surfaceState = state;
					return 'custom-surface';
				}}
			>
				<DialogContent aria-label="Primitive" className="custom-content">
					Body
				</DialogContent>
			</DialogSurface>
		</DialogOverlay>,
	);
	const dialog = page.getByRole('dialog', { name: 'Primitive' }).element();

	expect(dialog).toHaveClass('custom-content');
	expect(dialog.className.split(' ').length).toBeGreaterThan(1);
	expect(dialog.parentElement).toHaveClass('custom-surface');
	expect(dialog.parentElement?.className.split(' ').length).toBeGreaterThan(1);
	expect(overlayOf(dialog)).toHaveClass('custom-overlay');
	expect(overlayOf(dialog).className.split(' ').length).toBeGreaterThan(1);
	expect(overlayState).toHaveProperty('isEntering');
	expect(surfaceState).toHaveProperty('isExiting');
});

for (const appearance of visualAppearances) {
	test(`theme matrix: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		render(
			<Dialog
				description="Review the details before you continue."
				isOpen
				onOpenChange={vi.fn<(isOpen: boolean) => void>()}
				title="Example dialog"
			>
				<Button slot="close">Cancel</Button>
			</Dialog>,
			{ appearance },
		);
		await waitForOverlayEnter(overlayOf(dialogElement()));

		await captureVisualAppearance(page.elementLocator(document.body), 'dialog/default', appearance);
	});

	test(`close button: ${appearance.theme} ${appearance.mode}`, { tags: ['visual'] }, async () => {
		render(
			<Dialog
				description="Review the details before you continue."
				isOpen
				onOpenChange={vi.fn<(isOpen: boolean) => void>()}
				showCloseButton
				title="Example dialog"
			>
				<Button slot="close">Cancel</Button>
			</Dialog>,
			{ appearance },
		);
		await waitForOverlayEnter(overlayOf(dialogElement()));

		await captureVisualAppearance(
			page.elementLocator(document.body),
			'dialog/close-button',
			appearance,
		);
	});
}

test('forced-colors open', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');
	try {
		render(
			<Dialog
				description="Review the details before you continue."
				isOpen
				onOpenChange={vi.fn<(isOpen: boolean) => void>()}
				showCloseButton
				title="Example dialog"
			>
				<Button slot="close">Cancel</Button>
			</Dialog>,
		);
		await waitForOverlayEnter(overlayOf(dialogElement()));

		await captureVisual(page.elementLocator(document.body), 'dialog/forced-colors');
	} finally {
		await emulateForcedColors('none');
	}
});
