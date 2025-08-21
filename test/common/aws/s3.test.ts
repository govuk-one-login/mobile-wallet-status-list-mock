import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { putObject } from "../../../src/common/aws/s3";

const mockS3Client = mockClient(S3Client);

describe("putObject", () => {
  beforeEach(() => {
    mockS3Client.reset();
  });

  it("should send PutObjectCommand with the correct parameters", async () => {
    mockS3Client.on(PutObjectCommand).resolves({});
    const bucket = "test-bucket-name";
    const key = "jwks.json";
    const body = '{"keys":[{}]}';

    await putObject(bucket, key, body);

    expect(mockS3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
    });
  });

  it("should propagates underlying errors from the S3 client", async () => {
    mockS3Client.on(PutObjectCommand).rejects(new Error("S3 error"));
    const bucket = "test-bucket-name";
    const key = "jwks.json";
    const body = '{"keys":[{}]}';

    await expect(putObject(bucket, key, body)).rejects.toThrow("S3 error");
  });
});
