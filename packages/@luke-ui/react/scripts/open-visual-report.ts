import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = path.resolve(packageRoot, '../../../.artifacts/visual-regression/report/index.html');
await access(report);

if (platform() === 'darwin') execFileSync('open', [report], { stdio: 'inherit' });
else if (platform() === 'win32')
	execFileSync('cmd', ['/c', 'start', '', report], { stdio: 'inherit' });
else execFileSync('xdg-open', [report], { stdio: 'inherit' });
