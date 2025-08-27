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

    it("should successfully upload to S3", async () => {
        const s3Client = mockClient(S3Client);
        const bucket = "bucketName";
        const body = "token";
        const key = "key";

        s3Client.on(PutObjectCommand).resolves({});
        await expect(putObject(body, bucket, key)).resolves.not.toThrow();
        expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
            Body: body,
            Bucket: bucket,
            Key: key,
        });
    });

    it("should propagate S3 errors", async () => {
        const s3Client = mockClient(S3Client);
        const bucket = "bucketName";
        const body = "token";
        const key = "key";

        s3Client.on(PutObjectCommand).rejectsOnce(new Error("S3 upload failed"));
        await expect(putObject(body, bucket, key)).rejects.toThrow("S3 upload failed");
    });

});
