import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const processes = [
  spawn(process.execPath, ['--watch', '--env-file-if-exists=.env', 'server/server.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js')], { stdio: 'inherit' }),
];
let stopping = false;
const stop = code => { if (stopping) return; stopping = true; for (const child of processes) child.kill(); process.exitCode = code; };
for (const child of processes) { child.on('exit', code => stop(code ?? 0)); child.on('error', error => { console.error(error); stop(1); }); }
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
