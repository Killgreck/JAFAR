import dotenv from 'dotenv';

dotenv.config();

type AppEnvironment = 'development' | 'production' | 'test';

type EnvironmentConfig = {
  port: number;
  mongodbUri: string;
  appEnv: AppEnvironment;
};

/**
 * Parses the port number from a string.
 * @param rawPort The raw port string from the environment variable.
 * @returns The parsed port number.
 * @throws {Error} If the port is not a valid number.
 */
export function parsePort(rawPort: string | undefined): number {
  const port = Number(rawPort ?? '3000');
  if (Number.isNaN(port) || port < 0 || port > 65_535) {
    throw new Error('Environment variable PORT must be a number between 0 and 65535');
  }
  return port;
}

/**
 * Parses the application environment from a string.
 * @param env The raw environment string from the environment variable.
 * @returns The parsed application environment.
 * @throws {Error} If the environment is not a valid value.
 */
export function parseAppEnv(env: string | undefined): AppEnvironment {
  const value = (env ?? 'development').toLowerCase();
  if (value === 'development' || value === 'production' || value === 'test') {
    return value;
  }
  throw new Error('Environment variable APP_ENV must be development, production, or test');
}

/**
 * Returns the default MongoDB URI for the given application environment.
 * @param appEnv The application environment.
 * @returns The default MongoDB URI.
 */
function defaultMongoUri(appEnv: AppEnvironment): string {
  const suffix = appEnv === 'test' ? '-test' : '';
  return `mongodb://127.0.0.1:27017/jafar${suffix}`;
}

/**
 * Parses the MongoDB URI from a string.
 * @param uri The raw MongoDB URI string from the environment variable.
 * @param appEnv The application environment.
 * @returns The parsed MongoDB URI.
 * @throws {Error} If the MongoDB URI is required and not provided.
 */
export function parseMongoUri(uri: string | undefined, appEnv: AppEnvironment): string {
  if (uri && uri.trim().length > 0) {
    return uri;
  }

  if (appEnv === 'development' || appEnv === 'test') {
    return defaultMongoUri(appEnv);
  }

  throw new Error('Environment variable MONGODB_URI is required');
}

const appEnv = parseAppEnv(process.env.APP_ENV);

/**
 * The application's environment configuration.
 */
export const environment: EnvironmentConfig = {
  port: parsePort(process.env.PORT),
  mongodbUri: parseMongoUri(process.env.MONGODB_URI, appEnv),
  appEnv,
};