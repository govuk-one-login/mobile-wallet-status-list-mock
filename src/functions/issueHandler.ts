import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import { randomUUID } from "node:crypto";
import { putObject } from "../common/aws/s3";
import { getConfig } from "../config/getConfig";
import { createToken } from "../common/token/createToken";
import { getStatusListByIndex, STATUS_LIST_CONFIG} from "../common/statusList/statusList";

const REQUIRED_ENV_VARS = [
  "SIGNING_KEY_ID",
  "SELF_URL",
  "STATUS_LIST_BUCKET_NAME",
] as const;

export async function handler(
  _event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.ISSUE_LAMBDA_STARTED);

  const appConfig = getConfig(process.env, REQUIRED_ENV_VARS);

  const randomIndex = Math.floor(Math.random() * STATUS_LIST_CONFIG.length);
  const idx = STATUS_LIST_CONFIG[randomIndex].index;
  const statusList = getStatusListByIndex(idx, "valid");
  const objectKey = "t/" + randomUUID();
  const uri = `${appConfig.SELF_URL}/${objectKey}`;

  const token = await createToken({
    selfUrl: appConfig.SELF_URL,
    statusList,
    uri,
    keyId: appConfig.SIGNING_KEY_ID,
  });
  await putObject(appConfig.STATUS_LIST_BUCKET_NAME, objectKey, token);

  logger.info(LogMessage.ISSUE_LAMBDA_COMPLETED);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idx,
      uri,
    }),
  };
}