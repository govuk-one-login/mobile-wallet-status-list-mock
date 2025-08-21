import { sign } from "../../../src/common/aws/kms";
import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";

const kmsClient = mockClient(KMSClient);

describe("sign", () => {
  it("should return the signature", async () => {
    const expectedResult = new Uint8Array(123);
    kmsClient.on(SignCommand).resolves({
      Signature: expectedResult,
    });
    const result = await sign("message", "keyId");
    expect(result).toBe(expectedResult);
  });

  // it("should throw error when the signature is undefined", async() => {
  //     const
  // });
});
