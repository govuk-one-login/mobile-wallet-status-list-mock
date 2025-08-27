export interface Config {
  SIGNING_KEY_ID: string;
  JWKS_BUCKET_NAME: string;
  STATUS_LIST_BUCKET_NAME: string;
  SELF_URL: string;
}

export function getConfig<T extends keyof Config>(
  env: NodeJS.ProcessEnv,
  requiredFields: readonly T[],
): Pick<Config, T> {
  const missing = requiredFields.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const config: Partial<Config> = {};
  for (const field of requiredFields) {
    config[field] = env[field] as string;
  }

  return config as Pick<Config, T>;
}
