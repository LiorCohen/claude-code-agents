/**
 * Type definitions for configuration files.
 */

export type VersionInfo = {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export type PluginJson = {
  readonly version: string;
  readonly name?: string;
  readonly description?: string;
}

export type MarketplaceJson = {
  readonly plugins: readonly MarketplacePlugin[];
}

export type MarketplacePlugin = {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

export type HookInput = {
  readonly tool: string;
  readonly tool_input: HookToolInput;
}

export type HookToolInput = {
  readonly file_path?: string;
  readonly path?: string;
}

export type PreToolUseHookOutput = {
  readonly hookSpecificOutput: {
    readonly hookEventName: 'PreToolUse';
    readonly decision: {
      readonly behavior: 'allow' | 'block';
      readonly message?: string;
    };
  };
}

export type PostToolUseHookOutput = {
  readonly hookSpecificOutput: {
    readonly hookEventName: 'PostToolUse';
    readonly message: string;
  };
}
