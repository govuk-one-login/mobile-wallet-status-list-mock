import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import { randomUUID } from "crypto";
import { sign } from "../common/aws/kms";
import { putObject } from "../common/aws/s3";
import format from "ecdsa-sig-formatter";
import { getConfig } from "../config/getConfig";

const REQUIRED_ENV_VARS = [
  "SIGNING_KEY_ID",
  "SELF_URL",
  "STATUS_LIST_BUCKET_NAME",
] as const;

interface Configuration {
  index: number;
  statusList: StatusList;
}

interface StatusList {
  bits: number;
  lst: string;
}

const TTL = 2592000;
const ALGORITHM = "ES256";

export async function handler(
  _event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.ISSUE_LAMBDA_STARTED);

  const config = getConfig(process.env, REQUIRED_ENV_VARS);

  const configuration = getRandomConfig();
  const objectKey = randomUUID();
  const uri = `${config.SELF_URL}/t/${objectKey}`;
  const token = await createToken(
    configuration.statusList,
    uri,
    config.SIGNING_KEY_ID,
  );
  await putObject(token, config.STATUS_LIST_BUCKET_NAME, objectKey);

  logger.info(LogMessage.ISSUE_LAMBDA_COMPLETED);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idx: configuration.index,
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

export async function createToken(
  statusList: StatusList,
  uri: string,
  keyId: string,
) {
  const header = buildHeader(keyId);
  const payload = buildPayload(statusList, uri);

  const encodedHeader = base64Encoder(JSON.stringify(header));
  const encodedPayload = base64Encoder(JSON.stringify(payload));

  const message = `${encodedHeader}.${encodedPayload}`;

  const encodedSignature = base64Encoder(await sign(message, keyId));
  const signature = format.derToJose(encodedSignature, ALGORITHM);

  return `${message}.${signature}`;
}

function buildHeader(keyId: string) {
  return {
    alg: ALGORITHM,
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

function base64Encoder(data: string | Uint8Array<ArrayBufferLike>) {
  return Buffer.from(data).toString("base64url");
}
