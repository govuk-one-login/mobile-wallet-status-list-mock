import { sign } from "../../../src/common/aws/kms";
import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";

const kmsClient = mockClient(KMSClient);

describe("sign", () => {
  it("should return the signature", async () => {
    const expectedResult = new Uint8Array([1, 2, 3]);
    kmsClient.on(SignCommand).resolves({
      Signature: expectedResult,
    });
    const result = await sign("message", "keyId");
    expect(result).toBe(expectedResult);
  });

  it("should throw an error if no signature returned", async () => {
    kmsClient.on(SignCommand).resolves({ Signature: undefined });
    const result = sign("message", "keyId");
    await expect(result).rejects.toThrow("No Signature returned");
  });

  it("should handle KMS client errors", async () => {
    const kmsError = new Error("KMS Service Unavailable");
    kmsClient.on(SignCommand).rejects(kmsError);
    const result = sign("message", "keyId");
    await expect(result).rejects.toThrow(kmsError);
  });
});
