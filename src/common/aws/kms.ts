import { KMSClient, SignCommand, SignCommandInput } from "@aws-sdk/client-kms"; // ES Modules import

const client = new KMSClient();

export async function sign(
  message: string,
  keyId: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  const input: SignCommandInput = {
    KeyId: keyId,
    Message: Buffer.from(message),
    MessageType: "RAW",
    SigningAlgorithm: "ECDSA_SHA_256",
  };
  const command = new SignCommand(input);
  const response = await client.send(command);

  if (!response.Signature) {
    throw Error("No Signature returned");
  }

  return response.Signature;
}
