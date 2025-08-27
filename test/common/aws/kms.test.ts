import {
  KMSClient,
  GetPublicKeyCommand,
  SignCommand,
} from "@aws-sdk/client-kms";
import { sign } from "../../../src/common/aws/kms";
import { mockClient } from "aws-sdk-client-mock";
import { getPublicKey } from "../../../src/common/aws/kms";

const mockKmsClient = mockClient(KMSClient);

describe("kms", () => {
  const mockSpki = new Uint8Array([1, 2, 3]);

  beforeEach(() => {
    mockKmsClient.reset();
  });

  it("should return the public key", async () => {
    mockKmsClient.on(GetPublicKeyCommand).resolves({
      PublicKey: mockSpki,
    });

    const result = await getPublicKey("test-key");

    expect(result).toBe(mockSpki);
  });

  it("should throw error if PublicKey is undefined", async () => {
    mockKmsClient.on(GetPublicKeyCommand).resolves({
      PublicKey: undefined,
    });

    await expect(getPublicKey("test-key-id")).rejects.toThrow(
      "Invalid public key",
    );
  });

  it("should propagates underlying errors from the KMS client", async () => {
    mockKmsClient.on(GetPublicKeyCommand).rejects(new Error("KMS error"));

    await expect(getPublicKey("test-key-id")).rejects.toThrow("KMS error");
  });
});

describe("sign", () => {
  it("should return the signature", async () => {
    const expectedResult = new Uint8Array([1, 2, 3]);
    mockKmsClient.on(SignCommand).resolves({
      Signature: expectedResult,
    });
    const result = await sign("message", "keyId");
    expect(result).toBe(expectedResult);
  });

  it("should throw an error if no signature returned", async () => {
    mockKmsClient.on(SignCommand).resolves({ Signature: undefined });
    const result = sign("message", "keyId");
    await expect(result).rejects.toThrow("No Signature returned");
  });

  it("should propagate KMS client errors", async () => {
    const kmsError = new Error("KMS Service Unavailable");
    mockKmsClient.on(SignCommand).rejects(kmsError);
    const result = sign("message", "keyId");
    await expect(result).rejects.toThrow(kmsError);
  });
});
