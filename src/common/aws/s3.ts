import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client();

export async function upload(
  body: string,
  bucket: string,
  key: string,
): Promise<void> {
  const input = {
    Body: body,
    Bucket: bucket,
    Key: key,
  };
  const command = new PutObjectCommand(input);
  await client.send(command);
}
