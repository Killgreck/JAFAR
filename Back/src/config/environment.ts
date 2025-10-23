import dotenv from 'dotenv';

dotenv.config();

type AppEnvironment = 'development' | 'production' | 'test';

type EnvironmentConfig = {
  port: number;
  mongodbUri: string;
  appEnv: AppEnvironment;
};

export function parsePort(rawPort: string | undefined): number {
  const port = Number(rawPort ?? '3000');
  if (Number.isNaN(port) || port < 0 || port > 65_535) {
    throw new Error('Environment variable PORT must be a number between 0 and 65535');
  }
  return port;
}

export function parseAppEnv(env: string | undefined): AppEnvironment {
  const value = (env ?? 'development').toLowerCase();
  if (value === 'development' || value === 'production' || value === 'test') {
    return value;
  }
  throw new Error('Environment variable APP_ENV must be development, production, or test');
}

function defaultMongoUri(appEnv: AppEnvironment): string {
  const suffix = appEnv === 'test' ? '-test' : '';
  return `mongodb://127.0.0.1:27017/jafar${suffix}`;
}

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

export const environment: EnvironmentConfig = {
  port: parsePort(process.env.PORT),
  mongodbUri: parseMongoUri(process.env.MONGODB_URI, appEnv),
  appEnv,
};