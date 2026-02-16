/**
 * Database reset command.
 *
 * Reset database: teardown + setup + migrate + seed.
 *
 * Usage:
 *   sdd-system database reset <component-name>
 */

import type { CommandResult } from '@/lib/args';
import { teardown } from './teardown';
import { setup } from './setup';
import { migrate } from './migrate';
import { seed } from './seed';

export const reset = async (
  componentName: string,
  args: readonly string[],
  env: string = 'local'
): Promise<CommandResult> => {
  console.log(`Resetting database for component: ${componentName} (env: ${env})`);
  console.log('');

  // Step 1: Teardown
  console.log('Step 1/4: Teardown...');
  const teardownResult = await teardown(componentName, args, env);
  if (!teardownResult.success) {
    // Teardown may fail if nothing to tear down, continue anyway
    console.log('  (No existing deployment to tear down)');
  }
  console.log('');

  // Step 2: Setup
  console.log('Step 2/4: Setup...');
  const setupResult = await setup(componentName, args, env);
  if (!setupResult.success) {
    return {
      success: false,
      error: `Reset failed at setup: ${setupResult.error}`,
    };
  }
  console.log('');

  // Step 3: Migrate
  console.log('Step 3/4: Migrate...');
  const migrateResult = await migrate(componentName, args, env);
  if (!migrateResult.success) {
    return {
      success: false,
      error: `Reset failed at migrate: ${migrateResult.error}`,
    };
  }
  console.log('');

  // Step 4: Seed
  console.log('Step 4/4: Seed...');
  const seedResult = await seed(componentName, args, env);
  if (!seedResult.success) {
    return {
      success: false,
      error: `Reset failed at seed: ${seedResult.error}`,
    };
  }
  console.log('');

  console.log('Database reset complete!');

  return {
    success: true,
    message: 'Database reset complete',
    data: {
      setup: setupResult.data,
      migrate: migrateResult.data,
      seed: seedResult.data,
    },
  };
};
