// Temporary file to run Vite dev server
import { spawn } from 'child_process';

const vite = spawn('npx', ['vite', '--port', '5000', '--host', '0.0.0.0', '--strictPort'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
  },
});

vite.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

vite.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  vite.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
  process.exit(0);
});
