import { sign } from "../../../src/common/aws/kms";
import format from "ecdsa-sig-formatter";

export interface StatusList {
  bits: number;
  lst: string;
}

const TTL = 2592000;
const ALGORITHM = "ES256";

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
