import nextTranspileModules from 'next-transpile-modules';

const withTM = nextTranspileModules([
	// array of package names
	'@luke-ui/button',
]);
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
};

export default withTM(nextConfig);
