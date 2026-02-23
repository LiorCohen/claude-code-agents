/**
 * Argument parsing utilities for the CLI.
 */

export type GlobalOptions = {
  readonly json: boolean;
  readonly verbose: boolean;
  readonly help: boolean;
};

export type ParsedArgs = {
  readonly namespace: string | undefined;
  readonly action: string | undefined;
  readonly args: readonly string[];
  readonly options: GlobalOptions;
};

export type CommandResult = {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly message?: string;
};

type ParseState = {
  readonly namespace: string | undefined;
  readonly action: string | undefined;
  readonly args: readonly string[];
  readonly options: GlobalOptions;
  readonly index: number;
};

/**
 * Parse command line arguments into structured format.
 */
export const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const initial: ParseState = {
    namespace: undefined,
    action: undefined,
    args: [],
    options: { json: false, verbose: false, help: false },
    index: 0,
  };

  const step = (state: ParseState): ParseState => {
    if (state.index >= argv.length) return state;

    const arg = argv[state.index];
    if (!arg) return step({ ...state, index: state.index + 1 });

    if (arg.startsWith('--') || arg === '-h') {
      const optionResult = (() => {
        switch (arg) {
          case '--json':
            return { options: { ...state.options, json: true }, extraArgs: [] as readonly string[], skip: 0 };
          case '--verbose':
            return { options: { ...state.options, verbose: true }, extraArgs: [] as readonly string[], skip: 0 };
          case '--help':
          case '-h':
            return { options: { ...state.options, help: true }, extraArgs: [] as readonly string[], skip: 0 };
          default: {
            const nextArg = argv[state.index + 1];
            const hasValue = nextArg !== undefined && !nextArg.startsWith('-');
            return {
              options: state.options,
              extraArgs: hasValue ? [arg, nextArg] : [arg],
              skip: hasValue ? 1 : 0,
            };
          }
        }
      })();
      return step({
        ...state,
        options: optionResult.options,
        args: [...state.args, ...optionResult.extraArgs],
        index: state.index + 1 + optionResult.skip,
      });
    }

    if (!state.namespace) return step({ ...state, namespace: arg, index: state.index + 1 });
    if (!state.action) return step({ ...state, action: arg, index: state.index + 1 });
    return step({ ...state, args: [...state.args, arg], index: state.index + 1 });
  };

  const { namespace, action, args, options } = step(initial);
  return { namespace, action, args, options };
};

/**
 * Parse named arguments from an array of strings.
 * Supports: --key value and positional arguments.
 */
export const parseNamedArgs = (
  args: readonly string[]
): { readonly named: Readonly<Record<string, string>>; readonly positional: readonly string[] } => {
  type AccState = {
    readonly named: Readonly<Record<string, string>>;
    readonly positional: readonly string[];
    readonly index: number;
  };

  const step = (state: AccState): AccState => {
    if (state.index >= args.length) return state;

    const arg = args[state.index];
    if (!arg) return step({ ...state, index: state.index + 1 });

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[state.index + 1];
      const hasValue = nextArg !== undefined && !nextArg.startsWith('--');
      return step({
        named: { ...state.named, [key]: hasValue ? nextArg : 'true' },
        positional: state.positional,
        index: state.index + (hasValue ? 2 : 1),
      });
    }

    return step({
      ...state,
      positional: [...state.positional, arg],
      index: state.index + 1,
    });
  };

  const { named, positional } = step({ named: {}, positional: [], index: 0 });
  return { named, positional };
};

/**
 * Output a command result, respecting JSON mode.
 */
export const outputResult = (result: CommandResult, options: GlobalOptions): string => {
  const output = options.json
    ? JSON.stringify(result, null, 2)
    : !result.success && result.error
      ? `Error: ${result.error}`
      : result.message ?? '';

  if (!result.success && result.error && !options.json) {
    console.error(output);
  } else if (output) {
    console.log(output);
  }

  return output;
};
