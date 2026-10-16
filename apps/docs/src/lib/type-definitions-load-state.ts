import type { TypeDefinitionsPayload } from './type-definition-model.js';

export type TypeDefinitionsLoadState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { data: TypeDefinitionsPayload; status: 'ready' }
	| { message: string; status: 'error' };

export type TypeDefinitionsLoadAction =
	| { type: 'load-start' }
	| { data: TypeDefinitionsPayload; type: 'load-success' }
	| { message: string; type: 'load-error' };

/** A load starts from idle or after an error, and settles only while it is in flight. */
export function typeDefinitionsLoadReducer(
	state: TypeDefinitionsLoadState,
	action: TypeDefinitionsLoadAction,
): TypeDefinitionsLoadState {
	switch (action.type) {
		case 'load-start':
			if (state.status === 'loading' || state.status === 'ready') return state;
			return { status: 'loading' };
		case 'load-success':
			if (state.status !== 'loading') return state;
			return { data: action.data, status: 'ready' };
		case 'load-error':
			if (state.status !== 'loading') return state;
			return { message: action.message, status: 'error' };
	}
}
