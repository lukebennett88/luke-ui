import type { ReactNode } from 'react';

/**
 * Normalises nullish, boolean, and empty-string error messages to `undefined`.
 *
 * React Aria's `FieldError` only falls back to its generated message when
 * `children` is nullish, so `false` and `''` must be normalised first.
 */
export function normalizeErrorMessage(errorMessage: ReactNode): ReactNode {
	if (errorMessage == null || typeof errorMessage === 'boolean' || errorMessage === '') {
		return undefined;
	}

	return errorMessage;
}

/**
 * Derives a composed field's invalid state from its controlled error message.
 *
 * Returns `undefined` rather than `false` when there is no message: `false` would make React Aria
 * treat validity as controlled and suppress its own validation.
 */
export function isInvalidFromErrorMessage(errorMessage: ReactNode): true | undefined {
	return normalizeErrorMessage(errorMessage) === undefined ? undefined : true;
}
