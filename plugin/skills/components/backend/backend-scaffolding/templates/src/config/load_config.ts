import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'yaml';
import Ajv from 'ajv';

// Config type - components should define their own specific types in @{project}/config/types
// and import them via workspace dependency
export type Config = Readonly<{
  readonly port?: number;
  readonly probesPort?: number;
  readonly logLevel?: string;
  readonly database?: Readonly<{
    readonly host?: string;
    readonly port?: number;
    readonly name?: string;
    readonly user?: string;
    readonly passwordSecret?: string;
    readonly pool?: number;
  }>;
}>;

export const loadConfig = (): Config => {
  const configPath = process.env.SDD_CONFIG_PATH;
  if (!configPath) {
    throw new Error('SDD_CONFIG_PATH environment variable is required');
  }

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const config = parse(readFileSync(configPath, 'utf-8')) as Config;

  // Validate against schema if present (schema placed alongside config by the system CLI)
  const schemaPath = configPath.replace(/\.yaml$/, '.schema.json');
  if (existsSync(schemaPath)) {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as object;
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    if (!validate(config)) {
      throw new Error(`Config validation failed: ${JSON.stringify(validate.errors)}`);
    }
  }

  return config;
};
