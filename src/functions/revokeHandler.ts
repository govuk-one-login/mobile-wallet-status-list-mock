import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import { getConfig } from "../config/getConfig";
import { putObject } from "../common/aws/s3";
import { createToken } from "../common/token/createToken";
import { StatusList } from "../common/types/statusList";

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

  const { body } = event;
  const { uri, idx } = extractUriAndIndex(body);
  const objectKey = uri.substring(uri.lastIndexOf("/") + 1);
  const updatedToken = await createToken(
    getRevokedConfiguration(idx),
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
export function extractUriAndIndex(body: string | null): {
  uri: string;
  idx: number;
} {
  if (!body) {
    throw new Error("Request body is empty");
  }
  const tokenParts = body.split(".");
  const payload = JSON.parse(base64DecodeToString(tokenParts[1]));
  const { uri, idx } = payload;
  if (!uri || idx === undefined) {
    throw new Error("JWT payload is missing 'uri' or 'idx' claim");
  }
  return { uri, idx };
}

function base64DecodeToString(value: string): string {
  return Buffer.from(value, "base64url").toString();
}

export function getRevokedConfiguration(idx: number): StatusList {
  if (idx === 0) {
    return { bits: 2, lst: "eNpzdAEAAMgAhg" };
  } else {
    return { bits: 2, lst: "eNqTSwcAAKUAhg" };
  }
}
