import { KMSClient, GetPublicKeyCommand } from "@aws-sdk/client-kms";
import { mockClient } from "aws-sdk-client-mock";
import { getPublicKey } from "../../../src/common/aws/kms";

const mockKmsClient = mockClient(KMSClient);

describe("getPublicKey", () => {
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
