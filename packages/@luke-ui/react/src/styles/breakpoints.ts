export const responsiveBreakpoints = {
	xsmall: { minimumWidth: 0, query: '&' },
	small: { minimumWidth: 640, query: '@media screen and (width >= 640px)' },
	medium: { minimumWidth: 768, query: '@media screen and (width >= 768px)' },
	large: { minimumWidth: 1024, query: '@media screen and (width >= 1024px)' },
	xlarge: { minimumWidth: 1280, query: '@media screen and (width >= 1280px)' },
	xxlarge: { minimumWidth: 1536, query: '@media screen and (width >= 1536px)' },
} as const;
