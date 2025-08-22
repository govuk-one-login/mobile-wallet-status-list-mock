import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client();

export async function upload(
  token: string,
  bucketName: string,
  keyId: string,
): Promise<void> {
  const input = {
    Body: token,
    Bucket: bucketName,
    Key: keyId,
  };
  const command = new PutObjectCommand(input);
  await client.send(command);
}
