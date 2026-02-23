// State Machine: Generic finite state machine implementation
// Provides type-safe state transitions with validation

export type TransitionMap<S extends string> = {
  readonly [K in S]?: readonly S[];
};

export type StateMachineConfig<S extends string> = {
  readonly initial: S;
  readonly transitions: TransitionMap<S>;
};

export type StateMachine<S extends string> = {
  readonly getState: () => S;
  readonly canTransition: (to: S) => boolean;
  readonly transition: (to: S) => Promise<void>;
  readonly onTransition: (callback: TransitionCallback<S>) => () => void;
};

export type TransitionCallback<S extends string> = (
  from: S,
  to: S
) => void | Promise<void>;

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export const createStateMachine = <S extends string>(
  config: StateMachineConfig<S>
): StateMachine<S> => {
  let currentState: S = config.initial;
  const listeners: Set<TransitionCallback<S>> = new Set();

  // Find first substate for a parent state (e.g., "starting" -> "starting:database")
  const findFirstSubstate = (parent: S): S | null => {
    const allStates = Object.keys(config.transitions) as S[];
    const substates = allStates.filter((s) => s.startsWith(`${parent}:`));
    if (substates.length === 0) return null;
    // Return the first substate that is a valid transition from current state
    const allowedTransitions = config.transitions[currentState];
    return substates.find((s) => allowedTransitions?.includes(s)) ?? null;
  };

  const getState = (): S => currentState;

  const canTransition = (to: S): boolean => {
    const allowedTransitions = config.transitions[currentState];
    if (allowedTransitions?.includes(to)) return true;
    // Check if transitioning to a parent state with substates
    const firstSubstate = findFirstSubstate(to);
    return firstSubstate !== null;
  };

  const transition = async (to: S): Promise<void> => {
    const allowedTransitions = config.transitions[currentState];
    const directlyAllowed = allowedTransitions?.includes(to) ?? false;

    if (!directlyAllowed) {
      // Try to find first substate for the parent
      const firstSubstate = findFirstSubstate(to);
      if (firstSubstate) {
        const from = currentState;
        currentState = firstSubstate;
        for (const callback of listeners) {
          await callback(from, firstSubstate);
        }
        return;
      }
      throw new InvalidTransitionError(currentState, to);
    }

    const from = currentState;
    currentState = to;
    for (const callback of listeners) {
      await callback(from, to);
    }
  };

  const onTransition = (callback: TransitionCallback<S>): (() => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return {
    getState,
    canTransition,
    transition,
    onTransition,
  };
};
