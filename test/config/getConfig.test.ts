import { getConfig, Config } from "../../src/config/getConfig";

describe("getConfig", () => {
  const validEnv = {
    SIGNING_KEY_ID: "test-key-id",
    JWKS_BUCKET_NAME: "test-jwks-bucket-name",
    STATUS_LIST_BUCKET_NAME: "test-status-bucket-name",
  };

  it("should return a valid config when all required env vars are present", () => {
    const config = getConfig(validEnv as NodeJS.ProcessEnv);

    expect(config).toEqual<Config>({
      SIGNING_KEY_ID: "test-key-id",
      JWKS_BUCKET_NAME: "test-jwks-bucket-name",
      STATUS_LIST_BUCKET_NAME: "test-status-bucket-name",
    });
  });

  it("should throw error listing all missing env vars in the error message", () => {
    const incompleteEnv = {
      SIGNING_KEY_ID: "test-key-id",
      // JWKS_BUCKET_NAME missing
      // STATUS_LIST_BUCKET_NAME missing
    };

    expect(() => getConfig(incompleteEnv as NodeJS.ProcessEnv)).toThrow(
      "Missing required env vars: JWKS_BUCKET_NAME, STATUS_LIST_BUCKET_NAME",
    );
  });

  it("should throw error if a single required env var is missing", () => {
    const missingOneEnv = {
      SIGNING_KEY_ID: "test-key-id",
      JWKS_BUCKET_NAME: "test-jwks-bucket-name",
      // STATUS_LIST_BUCKET_NAME missing
    };

    expect(() => getConfig(missingOneEnv as NodeJS.ProcessEnv)).toThrow(
      "Missing required env vars: STATUS_LIST_BUCKET_NAME",
    );
  });
});
