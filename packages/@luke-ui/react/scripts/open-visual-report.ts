import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';
import { access } from 'node:fs/promises';
import {
	visualPackageRoot,
	visualRepoRootFromPackage,
	visualReportIndex,
} from './visual-regression-contract.js';

const report = visualReportIndex(visualRepoRootFromPackage(visualPackageRoot(import.meta.url)));
await access(report);

if (platform() === 'darwin') execFileSync('open', [report], { stdio: 'inherit' });
else if (platform() === 'win32')
	execFileSync('cmd', ['/c', 'start', '', report], { stdio: 'inherit' });
else execFileSync('xdg-open', [report], { stdio: 'inherit' });
