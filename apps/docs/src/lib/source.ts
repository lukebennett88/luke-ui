import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docs } from '../../.source/server';

export const source = loader({
	baseUrl: '/',
	plugins: [lucideIconsPlugin()],
	source: docs.toFumadocsSource(),
});
