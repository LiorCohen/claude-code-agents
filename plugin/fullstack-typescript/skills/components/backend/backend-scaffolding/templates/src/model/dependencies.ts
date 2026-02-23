// Model Dependencies: Interface defining what use-cases need from DAL
// The Controller wires these when creating use-cases

export type Dependencies = {
  // Add DAL function signatures here as features are implemented
  // Example:
  // readonly findUserById: (id: string) => Promise<User | null>;
  // readonly insertUser: (input: InsertUserInput) => Promise<User>;
};
