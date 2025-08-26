import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import crypto from "node:crypto";
import { JWK, JWKS } from "../types/jwks";
import { getPublicKey } from "../common/aws/kms";
import { getConfig } from "../config/getConfig";
import { putObject } from "../common/aws/s3";

const REQUIRED_ENV_VARS = ["SIGNING_KEY_ID", "JWKS_BUCKET_NAME"] as const;

export async function handler(
  _event: APIGatewayProxyEvent,
  context: Context,
): Promise<void> {
  logger.addContext(context);
  logger.info(LogMessage.JWKS_LAMBDA_STARTED);

  const config = getConfig(process.env, REQUIRED_ENV_VARS);

  const keyId = config.SIGNING_KEY_ID;
  const publicKey = await getPublicKey(keyId);
  const jwk: JWK = convertToJwk(publicKey, keyId);
  const jwks: JWKS = { keys: [jwk] };

  await putObject(
    config.JWKS_BUCKET_NAME,
    ".well-known/jwks.json",
    JSON.stringify(jwks),
  );

  logger.info(LogMessage.JWKS_LAMBDA_COMPLETED);
}

function convertToJwk(spki: Uint8Array<ArrayBufferLike>, keyId: string): JWK {
  const publicKey: crypto.JsonWebKey = crypto
    .createPublicKey({
      key: spki as Buffer,
      type: "spki",
      format: "der",
    })
    .export({ format: "jwk" });

  return {
    ...publicKey,
    use: "sig",
    kid: keyId,
    alg: "ES256",
  } as JWK;
}
