import { act } from 'react';
import type { Root } from 'react-dom/client';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

/** The identity class currently applied to `document.documentElement`, if any. */
let appliedIdentityClassName: string | undefined;

export function trackMountedRender(container: HTMLElement, root: Root): void {
	mounted.push({ container, root });
}

export function setAppliedIdentityClassName(className: string | undefined): void {
	appliedIdentityClassName = className;
}

export function getAppliedIdentityClassName(): string | undefined {
	return appliedIdentityClassName;
}

/**
 * Unmounts everything rendered by `render`. Registered globally, for both the
 * `browser` and `visual` Vitest projects, in `render-setup.ts`.
 */
export function cleanupMountedRenders(): void {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;

	if (appliedIdentityClassName != null) {
		document.documentElement.classList.remove(appliedIdentityClassName);
		appliedIdentityClassName = undefined;
	}
	delete document.documentElement.dataset.colorMode;
}
