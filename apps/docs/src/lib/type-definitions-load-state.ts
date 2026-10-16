import type { TypeDefinitionsPayload } from './type-definition-model.js';

export type TypeDefinitionsLoadState =
	| { status: 'idle' }
	| { status: 'loading'; href: string }
	| { status: 'ready'; data: TypeDefinitionsPayload; href: string }
	| { status: 'error'; href: string; message: string };

export type TypeDefinitionsLoadAction =
	| { href: string; type: 'load-start' }
	| { data: TypeDefinitionsPayload; href: string; type: 'load-success' }
	| { href: string; message: string; type: 'load-error' }
	| { type: 'reset' };

/**
 * Advances deferred definition loading. Success and error only apply while that exact href is
 * still the in-flight request, so an older response cannot overwrite a newer one.
 */
export function typeDefinitionsLoadReducer(
	state: TypeDefinitionsLoadState,
	action: TypeDefinitionsLoadAction,
): TypeDefinitionsLoadState {
	switch (action.type) {
		case 'reset':
			return { status: 'idle' };
		case 'load-start':
			return { href: action.href, status: 'loading' };
		case 'load-success':
			if (state.status !== 'loading' || state.href !== action.href) return state;
			return { data: action.data, href: action.href, status: 'ready' };
		case 'load-error':
			if (state.status !== 'loading' || state.href !== action.href) return state;
			return { href: action.href, message: action.message, status: 'error' };
	}
}
