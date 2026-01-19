// src/index.ts - THE ONLY FILE WITH SIDE EFFECTS (exception to index.ts rule for entry points)
// IMPORTANT: Telemetry must be imported FIRST before any other imports
import './telemetry/index.js';
import { createApp } from './app';
import { loadConfig } from './config';

const main = async (): Promise<void> => {
  const config = loadConfig();
  const app = createApp({ config });
  await app.start();
};

main().catch((error) => {
  console.error('Failed to start app:', error);
  process.exit(1);
});
