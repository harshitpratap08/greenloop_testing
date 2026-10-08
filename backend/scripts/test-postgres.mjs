import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['--test', 'tests/backend.test.mjs', 'tests/crud.test.mjs', 'tests/audit.test.mjs', 'tests/postgres.test.mjs'], {
  stdio: 'inherit', env: { ...process.env, GREENLOOP_TEST_POSTGRES: 'embedded' },
});
process.exitCode = result.status ?? 1;
