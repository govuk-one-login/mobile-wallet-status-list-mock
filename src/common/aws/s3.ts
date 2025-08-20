import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client();

export async function putObject(bucket: string, key: string, body: string) {
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/json",
  });
  await s3Client.send(putObjectCommand);
}
