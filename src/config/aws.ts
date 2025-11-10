import { KMSClientConfig } from "@aws-sdk/client-kms";
import { S3ClientConfig } from "@aws-sdk/client-s3";
import { logger } from "../logging/logger";

export interface LocalStackAwsConfig {
  endpoint: string;
  credentials: Credentials;
  region: string;
}

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

const AWS_REGION = "eu-west-2";
const LOCALSTACK_ENDPOINT = "http://host.docker.internal:4566";
// const LOCALSTACK_S3_ENDPOINT = "http://s3.host.docker.internal.localstack.cloud:4566";

export function getLocalStackAwsConfig(endpoint: string): LocalStackAwsConfig {
  return {
    endpoint: endpoint,
    credentials: {
      accessKeyId: "na",
      secretAccessKey: "na",
    },
    region: AWS_REGION,
  };
}

export function getKmsConfig(
  isLocal: boolean,
): LocalStackAwsConfig | KMSClientConfig {
  if (isLocal) {
    logger.info("Running KMS locally");
    return getLocalStackAwsConfig(LOCALSTACK_ENDPOINT);
  }

  return {};
}

export function getS3Config(isLocal: boolean): S3ClientConfig {
  if (isLocal) {
    logger.info("Running S3 locally");
    return {
      ...getLocalStackAwsConfig(LOCALSTACK_ENDPOINT),
      forcePathStyle: true,
    };
  }

  return {};
}
