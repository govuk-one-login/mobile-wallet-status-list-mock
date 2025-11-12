import {
  getKmsConfig,
  getS3Config,
  getLocalStackAwsClientConfig,
} from "../../src/config/aws";

const AWS_REGION = "eu-west-2";
const LOCALSTACK_ENDPOINT = "http://host.docker.internal:4562";

describe("getLocalStackAwsClientConfig", () => {
  it("should return LocalStack AWS client config object", () => {
    const config = getLocalStackAwsClientConfig();

    expect(config).toEqual({
      endpoint: LOCALSTACK_ENDPOINT,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      region: AWS_REGION,
    });
  });
});

describe("getKmsConfig", () => {
  it("should return LocalStack AWS client config object when isLocal=true", () => {
    const isLocal = true;
    const config = getKmsConfig(isLocal);

    expect(config).toEqual({
      endpoint: LOCALSTACK_ENDPOINT,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      region: AWS_REGION,
    });
  });

  it("should return empty AWS client config object when isLocal=false", () => {
    const isLocal = false;
    const config = getKmsConfig(isLocal);

    expect(config).toEqual({});
  });
});

describe("getS3Config", () => {
  it("should return LocalStack AWS client config object with forcePathStyle when isLocal=true", () => {
    const isLocal = true;
    const config = getS3Config(isLocal);

    expect(config).toEqual({
      endpoint: LOCALSTACK_ENDPOINT,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      region: AWS_REGION,
      forcePathStyle: true,
    });
  });

  it("should return empty AWS client config object when isLocal=false", () => {
    const isLocal = false;
    const config = getS3Config(isLocal);

    expect(config).toEqual({});
  });
});
