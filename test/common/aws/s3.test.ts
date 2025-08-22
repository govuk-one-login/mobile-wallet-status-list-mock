import { mockClient } from "aws-sdk-client-mock";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "aws-sdk-client-mock-jest";
import { upload } from "../../../src/common/aws/s3";

const s3Client = mockClient(S3Client);

const bucket = "bucketName";
const body = "token";
const key = "key";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("upload", () => {
  it("should upload the token in s3 bucket", async () => {
    s3Client.on(PutObjectCommand).resolves({});
    await expect(upload(body, bucket, key)).resolves.not.toThrow();
    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Body: body,
      Bucket: bucket,
      Key: key,
    });
  });

  it("should throw error when s3 client throws an error", async () => {
    s3Client.on(PutObjectCommand).rejectsOnce(new Error("S3 upload failed"));
    await expect(upload(body, bucket, key)).rejects.toThrow("S3 upload failed");
  });
});
