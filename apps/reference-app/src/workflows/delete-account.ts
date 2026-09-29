export type DeleteAccountState = {
	error: string | null;
	status: 'idle' | 'confirming' | 'deleting' | 'failed' | 'completed';
};

export type DeleteAccountAction =
	| { type: 'open' }
	| { type: 'cancel' }
	| { type: 'confirm' }
	| { type: 'fail'; error: string }
	| { type: 'succeed' }
	| { type: 'reset' };

export const initialDeleteAccountState: DeleteAccountState = {
	error: null,
	status: 'idle',
};

export function deleteAccountReducer(
	state: DeleteAccountState,
	action: DeleteAccountAction,
): DeleteAccountState {
	switch (action.type) {
		case 'open':
			return { error: null, status: 'confirming' };
		case 'cancel':
			return state.status === 'deleting' ? state : { error: null, status: 'idle' };
		case 'confirm':
			return state.status === 'confirming' || state.status === 'failed'
				? { error: null, status: 'deleting' }
				: state;
		case 'fail':
			return { error: action.error, status: 'failed' };
		case 'succeed':
			return { error: null, status: 'completed' };
		case 'reset':
			return initialDeleteAccountState;
		default:
			return state;
	}
}
