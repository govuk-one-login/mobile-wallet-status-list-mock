export interface Config {
  SIGNING_KEY_ID: string;
  JWKS_BUCKET_NAME: string;
  STATUS_LIST_BUCKET_NAME: string;
}

const REQUIRED_ENV_VARS = [
  "SIGNING_KEY_ID",
  "JWKS_BUCKET_NAME",
  "STATUS_LIST_BUCKET_NAME",
] as const;

export function getConfig(env: NodeJS.ProcessEnv): Config {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return {
    SIGNING_KEY_ID: env.SIGNING_KEY_ID as string,
    JWKS_BUCKET_NAME: env.JWKS_BUCKET_NAME as string,
    STATUS_LIST_BUCKET_NAME: env.STATUS_LIST_BUCKET_NAME as string,
  };
}
