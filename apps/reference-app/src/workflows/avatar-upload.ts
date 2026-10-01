export type AvatarUploadState =
	| {
			status: 'idle';
	  }
	| {
			status: 'reading';
			file: File;
	  }
	| {
			status: 'readFailed';
			error: string;
	  };

export type AvatarUploadAction =
	| {
			type: 'selected';
			file: File;
	  }
	| {
			type: 'rejected';
			error: string;
	  }
	| {
			type: 'readFailed';
			error: string;
	  }
	| {
			type: 'reset';
	  };

export const initialAvatarUploadState: AvatarUploadState = {
	status: 'idle',
};

export function avatarUploadReducer(
	state: AvatarUploadState,
	action: AvatarUploadAction,
): AvatarUploadState {
	switch (action.type) {
		case 'selected':
			return {
				file: action.file,
				status: 'reading',
			};
		case 'rejected':
			return {
				error: action.error,
				status: 'readFailed',
			};
		case 'readFailed':
			if (state.status !== 'reading') return state;
			return {
				error: action.error,
				status: 'readFailed',
			};
		case 'reset':
			return initialAvatarUploadState;
	}
}
