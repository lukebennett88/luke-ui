import { expect, test } from 'vite-plus/test';
import { isDocsStaticDeploy, readDocsDeployMode } from './docs-deploy-mode.js';

test('readDocsDeployMode defaults to ssr when DOCS_STATIC is unset', () => {
	expect(readDocsDeployMode({})).toBe('ssr');
	expect(readDocsDeployMode({ DOCS_STATIC: undefined })).toBe('ssr');
	expect(readDocsDeployMode({ DOCS_STATIC: '' })).toBe('ssr');
	expect(readDocsDeployMode({ DOCS_STATIC: 'false' })).toBe('ssr');
	expect(readDocsDeployMode({ DOCS_STATIC: '0' })).toBe('ssr');
});

test('readDocsDeployMode treats true and 1 as static', () => {
	expect(readDocsDeployMode({ DOCS_STATIC: 'true' })).toBe('static');
	expect(readDocsDeployMode({ DOCS_STATIC: 'TRUE' })).toBe('static');
	expect(readDocsDeployMode({ DOCS_STATIC: '1' })).toBe('static');
	expect(readDocsDeployMode({ DOCS_STATIC: ' true ' })).toBe('static');
});

test('isDocsStaticDeploy mirrors readDocsDeployMode', () => {
	expect(isDocsStaticDeploy({})).toBe(false);
	expect(isDocsStaticDeploy({ DOCS_STATIC: 'true' })).toBe(true);
});
