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
  "SELF_URL",
] as const;

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.REVOKE_LAMBDA_STARTED);

  const appConfig = getConfig(process.env, REQUIRED_ENV_VARS);

  const { uri, idx } = extractUriAndIndex(event.body);
  const url = new URL(uri);
  const objectKey = url.pathname.slice(1);

  const statusListToken = await createToken({
    selfUrl: appConfig.SELF_URL,
    statusList: getRevokedConfiguration(idx),
    uri,
    keyId: appConfig.SIGNING_KEY_ID,
  });
  await putObject(
    appConfig.STATUS_LIST_BUCKET_NAME,
    objectKey,
    statusListToken,
  );

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

function extractUriAndIndex(body: string | null): {
  uri: string;
  idx: number;
} {
  if (!body) {
    throw new Error("Event body is missing");
  }

  let uri, idx;
  try {
    const tokenParts = body.split(".");
    const payloadStr = Buffer.from(tokenParts[1], "base64url").toString();
    const payload = JSON.parse(payloadStr);
    uri = payload.uri;
    idx = payload.idx;
  } catch (error) {
    throw new Error(
      `Failed to extract uri and idx from JWT: ${error}`,
    );
  }

  if (typeof uri !== "string" || !uri.trim()) {
    throw new Error("JWT payload 'uri' claim must be a non-empty string");
  }

  if (typeof idx !== "number") {
    throw new Error("JWT payload 'idx' claim must be a number");
  }

  return { uri, idx };
}

function getRevokedConfiguration(idx: number): StatusList {
  if (idx === 0) {
    return { bits: 2, lst: "eNpzdAEAAMgAhg" };
  } else {
    return { bits: 2, lst: "eNqTSwcAAKUAhg" };
  }
}
