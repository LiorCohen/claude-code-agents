/**
 * Type definitions for configuration files.
 */

export type PluginJson = {
  readonly version: string;
  readonly name?: string;
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
