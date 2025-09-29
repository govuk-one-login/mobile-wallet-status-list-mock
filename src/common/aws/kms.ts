import {
  GetPublicKeyCommand,
  GetPublicKeyCommandOutput,
  SignCommand,
  SignCommandInput,
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
  const publicKey = getPublicKeyCommandOutput.PublicKey;
  if (publicKey === undefined) {
    throw new Error("Invalid public key");
  }
  return publicKey;
}

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
  const response = await kmsClient.send(command);

  if (!response.Signature) {
    throw new Error("No Signature returned");
  }

  return response.Signature;
}
