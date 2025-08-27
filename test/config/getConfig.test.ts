import { getConfig, Config } from "../../src/config/getConfig";

describe("getConfig", () => {
  const validEnv = {
    SIGNING_KEY_ID: "test-key-id",
    JWKS_BUCKET_NAME: "test-jwks-bucket-name",
    STATUS_LIST_BUCKET_NAME: "test-status-bucket-name",
    SELF_URL: "https://test-status-list.com",
  };

  it("should return config with single required field", () => {
    const config = getConfig(
      validEnv as NodeJS.ProcessEnv,
      ["SIGNING_KEY_ID"] as const,
    );

    expect(config).toEqual({
      SIGNING_KEY_ID: "test-key-id",
    });
  });

  it("should return config with multiple required fields", () => {
    const config = getConfig(
      validEnv as NodeJS.ProcessEnv,
      ["SIGNING_KEY_ID", "JWKS_BUCKET_NAME"] as const,
    );

    expect(config).toEqual({
      SIGNING_KEY_ID: "test-key-id",
      JWKS_BUCKET_NAME: "test-jwks-bucket-name",
    });
  });

  it("should return config with all fields", () => {
    const config = getConfig(
      validEnv as NodeJS.ProcessEnv,
      [
        "SIGNING_KEY_ID",
        "JWKS_BUCKET_NAME",
        "STATUS_LIST_BUCKET_NAME",
        "SELF_URL",
      ] as const,
    );

    expect(config).toEqual<Config>({
      SIGNING_KEY_ID: "test-key-id",
      JWKS_BUCKET_NAME: "test-jwks-bucket-name",
      STATUS_LIST_BUCKET_NAME: "test-status-bucket-name",
      SELF_URL: "https://test-status-list.com",
    });
  });

  it("should handle empty required fields array", () => {
    const config = getConfig(validEnv as NodeJS.ProcessEnv, []);

    expect(config).toEqual({});
  });

  it("should not throw error for missing env vars that are not required", () => {
    const partialEnv = {
      SIGNING_KEY_ID: "test-key-id",
      // Other fields missing but not required
    };

    const config = getConfig(
      partialEnv as NodeJS.ProcessEnv,
      ["SIGNING_KEY_ID"] as const,
    );

    expect(config).toEqual({
      SIGNING_KEY_ID: "test-key-id",
    });
  });

  it("should throw error for single missing required env var", () => {
    const missingOneEnv = {
      JWKS_BUCKET_NAME: "test-jwks-bucket-name",
      STATUS_LIST_BUCKET_NAME: "test-status-bucket-name",
      // SIGNING_KEY_ID missing
    };

    expect(() => {
      getConfig(
        missingOneEnv as NodeJS.ProcessEnv,
        ["SIGNING_KEY_ID"] as const,
      );
    }).toThrow("Missing required env vars: SIGNING_KEY_ID");
  });

  it("should throw error for multiple missing required env vars", () => {
    const missingMultipleEnv = {
      SIGNING_KEY_ID: "test-key-id",
      // JWKS_BUCKET_NAME missing
      // STATUS_LIST_BUCKET_NAME missing
    };

    expect(() => {
      getConfig(
        missingMultipleEnv as NodeJS.ProcessEnv,
        [
          "SIGNING_KEY_ID",
          "JWKS_BUCKET_NAME",
          "STATUS_LIST_BUCKET_NAME",
          "SELF_URL",
        ] as const,
      );
    }).toThrow(
      "Missing required env vars: JWKS_BUCKET_NAME, STATUS_LIST_BUCKET_NAME",
    );
  });

  it("should throw error when env var is falsy (undefined)", () => {
    const undefinedEnv = {
      SIGNING_KEY_ID: undefined,
      JWKS_BUCKET_NAME: "test-jwks-bucket-name",
    };

    expect(() => {
      getConfig(undefinedEnv as NodeJS.ProcessEnv, ["SIGNING_KEY_ID"] as const);
    }).toThrow("Missing required env vars: SIGNING_KEY_ID");
  });
});
