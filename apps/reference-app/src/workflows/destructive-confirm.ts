export type DestructiveConfirmState = {
	error: string | null;
	status: 'idle' | 'confirming' | 'pending' | 'failed' | 'completed';
};

export type DestructiveConfirmAction =
	| { type: 'open' }
	| { type: 'cancel' }
	| { type: 'confirm' }
	| { type: 'fail'; error: string }
	| { type: 'succeed' };

export const initialDestructiveConfirmState: DestructiveConfirmState = {
	error: null,
	status: 'idle',
};

export function destructiveConfirmReducer(
	state: DestructiveConfirmState,
	action: DestructiveConfirmAction,
): DestructiveConfirmState {
	switch (action.type) {
		case 'open':
			return { error: null, status: 'confirming' };
		case 'cancel':
			return state.status === 'pending' ? state : { error: null, status: 'idle' };
		case 'confirm':
			return state.status === 'confirming' || state.status === 'failed'
				? { error: null, status: 'pending' }
				: state;
		case 'fail':
			return { error: action.error, status: 'failed' };
		case 'succeed':
			return { error: null, status: 'completed' };
		default:
			return state;
	}
}
