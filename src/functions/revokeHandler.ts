import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import { getConfig } from "../config/getConfig";
import { putObject } from "../common/aws/s3";
import { createToken, StatusList } from "../common/token/createToken";

const REQUIRED_ENV_VARS = [
  "STATUS_LIST_BUCKET_NAME",
  "SIGNING_KEY_ID",
] as const;

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.REVOKE_LAMBDA_STARTED);

  const config = getConfig(process.env, REQUIRED_ENV_VARS);

  const requestJWT = event.body;
  const uri = getRequestBody(requestJWT).uri;
  const index = getRequestBody(requestJWT).idx;
  const objectKey = uri.substring(uri.lastIndexOf("/") + 1);

  const updatedToken = await createToken(
    getRevokedConfiguration(index),
    uri,
    config.SIGNING_KEY_ID,
  );
  await putObject(config.STATUS_LIST_BUCKET_NAME, objectKey, updatedToken);

  logger.info(LogMessage.REVOKE_LAMBDA_COMPLETED);
  return {
    statusCode: 202,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Request processed for revocation",
      revokedAt: Date.now(),
    }),
  };
}

export function getRequestBody(jwt: string | null) {
  if (!jwt) {
    throw new Error("Request body is empty");
  }

  const payload = Buffer.from(jwt.split(".")[1], "base64url").toString();
  const data = JSON.parse(payload);

  if (!data.uri || !data.idx) {
    throw new Error("JWT payload is missing 'uri' or 'idx' claim");
  }
  return data;
}

export function getRevokedConfiguration(idx: number): StatusList {
  if (idx === 0) {
    return { bits: 2, lst: "eNpzdAEAAMgAhg" };
  } else {
    return { bits: 2, lst: "eNqTSwcAAKUAhg" };
  }
}
