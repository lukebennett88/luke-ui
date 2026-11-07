import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { useCopyButton } from './use-copy-button.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.useRealTimers();
});

test('invokes the copy callback synchronously during the click', () => {
	const copy = vi.fn<() => void>();
	renderCopy(copy);

	act(() => {
		page
			.getByRole('button', { name: 'idle' })
			.element()
			.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(copy).toHaveBeenCalledOnce();
	});
});

test('reports a synchronous copy exception', async () => {
	renderCopy(() => {
		throw new Error('denied');
	});

	await act(async () => {
		page
			.getByRole('button', { name: 'idle' })
			.element()
			.dispatchEvent(new MouseEvent('click', { bubbles: true }));
	});
	await expect.element(page.getByRole('button', { name: 'error' })).toBeVisible();
});

for (const newerResult of ['success', 'failure'] as const) {
	test(`ignores an older completion after the newer attempt reports ${newerResult}`, async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		const older = deferredCopy();
		const newer = deferredCopy();
		const copy = vi
			.fn<() => Promise<void>>()
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(newer.promise);
		renderCopy(copy);

		act(() => {
			const button = page.getByRole('button', { name: 'idle' }).element();
			button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});
		await act(async () => {
			if (newerResult === 'success') newer.resolve();
			else newer.reject(new Error('denied'));
		});
		const expected = newerResult === 'success' ? 'copied' : 'error';
		await expect.element(page.getByRole('button', { name: expected })).toBeVisible();

		await act(async () => {
			vi.advanceTimersByTime(1000);
			if (newerResult === 'success') older.reject(new Error('old failure'));
			else older.resolve();
		});
		await expect.element(page.getByRole('button', { name: expected })).toBeVisible();
		await act(async () => vi.advanceTimersByTime(500));
		await expect.element(page.getByRole('button', { name: 'idle' })).toBeVisible();
	});
}

test('does not let an older completion reset a newer result', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const older = deferredCopy();
	const newer = deferredCopy();
	const copy = vi
		.fn<() => Promise<void>>()
		.mockReturnValueOnce(older.promise)
		.mockReturnValueOnce(newer.promise);
	renderCopy(copy);

	act(() => {
		const button = page.getByRole('button', { name: 'idle' }).element();
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
	});
	await act(async () => older.resolve());
	await expect.element(page.getByRole('button', { name: 'idle' })).toBeVisible();

	await act(async () => {
		vi.advanceTimersByTime(1000);
		newer.resolve();
	});
	await expect.element(page.getByRole('button', { name: 'copied' })).toBeVisible();
	await act(async () => vi.advanceTimersByTime(500));
	await expect.element(page.getByRole('button', { name: 'copied' })).toBeVisible();
	await act(async () => vi.advanceTimersByTime(1000));
	await expect.element(page.getByRole('button', { name: 'idle' })).toBeVisible();
});

function renderCopy(onCopy: () => unknown) {
	function CopyButton() {
		const [status, onClick] = useCopyButton(onCopy);
		return <button onClick={onClick}>{status}</button>;
	}
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => root?.render(<CopyButton />));
}

function deferredCopy() {
	let resolve!: () => void;
	let reject!: (reason: Error) => void;
	const promise = new Promise<void>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
}
