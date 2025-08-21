import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import { randomUUID } from "crypto";

interface Configuration {
  index: number;
  statusList: StatusList;
}

interface StatusList {
  bits: number;
  lst: string;
}

const TTL = 259200;

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.ISSUE_LAMBDA_STARTED);

  const config = getRandomConfig();

  const header = buildHeader(process.env.SIGNING_KEY_ID!);
  const objectKey = randomUUID();
  const uri = `${process.env.SELF_URL}/t/${objectKey}`;
  const payload = buildPayload(config.statusList, uri);

  logger.info(LogMessage.ISSUE_LAMBDA_COMPLETED);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idx: config.index,
      uri: uri,
    }),
  };
}

function getRandomConfig(): Configuration {
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

function buildHeader(keyId: string) {
  return {
    alg: "ES256",
    kid: keyId,
    typ: "statuslist+jwt",
  };
}

function buildPayload(statusList: StatusList, uri: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    iat: timestamp,
    exp: timestamp + TTL,
    status_list: statusList,
    sub: uri,
    ttl: TTL,
  };
}

function base64Encoder(object: object) {
  return Buffer.from(JSON.stringify(object)).toString("base64");
}
