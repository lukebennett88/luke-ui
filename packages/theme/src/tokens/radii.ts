const radiiScale = [0, 2, 4, 8, 16] as const;

/** Radii tokens */
export const radii = {
	none: radiiScale[0],
	small: radiiScale[1],
	medium: radiiScale[2],
	large: radiiScale[3],
	xlarge: radiiScale[4],
};
