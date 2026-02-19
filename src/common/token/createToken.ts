import { sign } from "../aws/kms";
import format from "ecdsa-sig-formatter";
import { StatusList } from "../types/statusList";

const TTL = 3600;
const ALGORITHM = "ES256";
const TYP = "statuslist+jwt";

interface CreateTokenParams {
  selfUrl: string;
  statusList: StatusList;
  uri: string;
  keyId: string;
}

export async function createToken(params: CreateTokenParams) {
  const { selfUrl, statusList, uri, keyId } = params;
  const header = buildHeader(keyId);
  const payload = buildPayload(selfUrl, statusList, uri);

  const encodedHeader = base64Encoder(JSON.stringify(header));
  const encodedPayload = base64Encoder(JSON.stringify(payload));

  const message = `${encodedHeader}.${encodedPayload}`;

  const encodedSignature = base64Encoder(await sign(message, keyId));
  const signature = format.derToJose(encodedSignature, ALGORITHM);

  return `${message}.${signature}`;
}

export function buildHeader(keyId: string) {
  return {
    alg: ALGORITHM,
    kid: keyId,
    typ: TYP,
  };
}

export function buildPayload(
  selfUrl: string,
  statusList: StatusList,
  uri: string,
) {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    iat: timestamp,
    exp: timestamp + TTL,
    iss: selfUrl,
    status_list: statusList,
    sub: uri,
    ttl: TTL,
  };
}

export function base64Encoder(data: string | Uint8Array<ArrayBufferLike>) {
  return Buffer.from(data).toString("base64url");
}
