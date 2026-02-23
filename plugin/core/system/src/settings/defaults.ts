/**
 * Default settings for the core settings system.
 *
 * Only system-level defaults live here. Tech-specific component defaults
 * are managed by each tech pack's own settings system.
 */

import type { LogLevel, SystemSettings } from '@/types';

/** Default system settings */
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  logging: {
    enabled: true,
    level: 'info' as LogLevel,
  },
};
