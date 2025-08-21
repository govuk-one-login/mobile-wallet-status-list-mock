import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { putObject } from "../../../src/common/aws/s3";

const s3Mock = mockClient(S3Client);

describe("putObject", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("should send PutObjectCommand with the correct parameters", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    const bucket = "test-bucket-name";
    const key = "jwks.json";
    const body = '{"keys":[{}]}';

    await putObject(bucket, key, body);

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
    });
  });

  it("should propagates underlying errors from the S3 client", async () => {
    s3Mock.on(PutObjectCommand).rejects(new Error("S3 error"));
    const bucket = "test-bucket-name";
    const key = "jwks.json";
    const body = '{"keys":[{}]}';

    await expect(putObject(bucket, key, body)).rejects.toThrow("S3 error");
  });
});
