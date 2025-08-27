import { mockClient } from "aws-sdk-client-mock";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "aws-sdk-client-mock-jest";
import { upload } from "../../../src/common/aws/s3";

const bucket = "bucketName";
const body = "token";
const key = "key";

beforeEach(() => {
  jest.resetModules();
});

describe("upload", () => {
  it("should successfully upload to S3", async () => {
    const s3Client = mockClient(S3Client);
    s3Client.on(PutObjectCommand).resolves({});
    await expect(upload(body, bucket, key)).resolves.not.toThrow();
    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Body: body,
      Bucket: bucket,
      Key: key,
    });
  });

  it("should propagate S3 errors", async () => {
    const s3Client = mockClient(S3Client);
    s3Client.on(PutObjectCommand).rejectsOnce(new Error("S3 upload failed"));
    await expect(upload(body, bucket, key)).rejects.toThrow("S3 upload failed");
  });
});
