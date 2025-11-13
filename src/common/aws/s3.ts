import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getS3Config } from "../../config/aws";

const config = getS3Config(process.env.ENVIRONMENT === "local");
const s3Client = new S3Client(config);

export async function putObject(
  bucket: string,
  key: string,
  body: string,
): Promise<void> {
  const putObjectCommand: PutObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/json",
  });
  await s3Client.send(putObjectCommand);
}
