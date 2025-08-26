import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";
import { randomUUID } from "crypto";
import { sign } from "../common/aws/kms";
import { upload } from "../common/aws/s3";
import format from "ecdsa-sig-formatter";

interface Configuration {
  index: number;
  statusList: StatusList;
}

interface StatusList {
  bits: number;
  lst: string;
}

const TTL = 2592000;

export async function handler(
  _event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);
  logger.info(LogMessage.ISSUE_LAMBDA_STARTED);

  const config = getRandomConfig();
  const objectKey = randomUUID();
  const uri = `${process.env.SELF_URL}/t/${objectKey}`;
  const keyId = process.env.SIGNING_KEY_ID!;
  const token = await createToken(config.statusList, uri, keyId);
  await upload(token, process.env.STATUS_LIST_BUCKET_NAME!, objectKey);

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

  // Generate a cryptographically secure random number
  const randomBuffer = crypto.getRandomValues(new Uint8Array(1));
  const randomNumber = randomBuffer[0] / (0xffffffff + 1); // Normalize to [0, 1)

  const index = Math.floor(randomNumber * configurations.length);
  return configurations[index];
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

  const signature = await sign(message, keyId);
  const signature64Encoded = base64Encoder(signature);
  const signatureJose = format.derToJose(signature64Encoded, "ES256");

  return `${message}.${signatureJose}`;
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

function base64Encoder(data: string | Uint8Array<ArrayBufferLike>) {
  return Buffer.from(data).toString("base64url");
}
