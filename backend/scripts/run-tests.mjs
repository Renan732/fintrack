import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const testDbPath = path.join(backendDir, 'prisma', 'test.db');

function cleanupTestDb() {
  for (const suffix of ['', '-journal', '-shm', '-wal']) {
    const file = `${testDbPath}${suffix}`;
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
}

cleanupTestDb();

const env = {
  ...process.env,
  DATABASE_URL: 'file:./test.db',
  JWT_SECRET: 'test-secret-fintrack-key',
  NODE_ENV: 'test',
};

const isWindows = process.platform === 'win32';
const prismaBin = path.join(backendDir, 'node_modules', '.bin', isWindows ? 'prisma.cmd' : 'prisma');
const tsxBin = path.join(backendDir, 'node_modules', '.bin', isWindows ? 'tsx.cmd' : 'tsx');

const push = spawnSync(prismaBin, ['db', 'push', '--skip-generate'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
  shell: isWindows,
});

if (push.status !== 0) {
  cleanupTestDb();
  process.exit(push.status ?? 1);
}

const testRun = spawnSync(tsxBin, ['--test', 'tests/api.test.ts'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
  shell: isWindows,
});

cleanupTestDb();
process.exit(testRun.status ?? 1);
