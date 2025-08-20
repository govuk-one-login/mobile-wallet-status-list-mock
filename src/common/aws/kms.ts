import {
  GetPublicKeyCommand,
  GetPublicKeyCommandOutput,
  KMSClient,
} from "@aws-sdk/client-kms";

const kmsClient = new KMSClient();

export async function getPublicKey(
  keyId: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  const getPublicKeyCommand: GetPublicKeyCommand = new GetPublicKeyCommand({
    KeyId: keyId,
  });
  const getPublicKeyCommandOutput: GetPublicKeyCommandOutput =
    await kmsClient.send(getPublicKeyCommand);
  const spki = getPublicKeyCommandOutput.PublicKey;
  if (spki === undefined) {
    throw new Error("Invalid public key");
  }
  return spki;
}
