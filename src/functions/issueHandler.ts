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
import { StatusList } from "../common/types/statusList";

const REQUIRED_ENV_VARS = [
  "SIGNING_KEY_ID",
  "SELF_URL",
  "STATUS_LIST_BUCKET_NAME",
] as const;

interface StatusListConfig {
  index: number;
  statusList: StatusList;
}

export async function handler(
  _event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.ISSUE_LAMBDA_STARTED);

  const appConfig = getConfig(process.env, REQUIRED_ENV_VARS);

  const statusListConfig = getRandomStatusListConfig();
  const objectKey = "t/" + randomUUID();
  const uri = `${appConfig.SELF_URL}/${objectKey}`;

  const token = await createToken({
    selfUrl: appConfig.SELF_URL,
    statusList: statusListConfig.statusList,
    uri,
    keyId: appConfig.SIGNING_KEY_ID,
  });
  await putObject(appConfig.STATUS_LIST_BUCKET_NAME, objectKey, token);

  logger.info(LogMessage.ISSUE_LAMBDA_COMPLETED);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idx: statusListConfig.index,
      uri,
    }),
  };
}

function getRandomStatusListConfig(): StatusListConfig {
  const configurations = [
    { index: 0, statusList: { bits: 2, lst: "eNpzcAEAAMYAhQ" } },
    {
      index: 5,
      statusList: {
        bits: 2,
        lst: "eNqTSwYAAKEAgg",
      },
    },
  ];

  return configurations[Math.floor(Math.random() * configurations.length)];
}
