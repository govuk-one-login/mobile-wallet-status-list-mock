import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../../src/functions/revokeHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";
import { putObject } from "../../src/common/aws/s3";
import { createToken } from "../../src/common/token/createToken";

jest.mock("../../src/common/aws/s3");
jest.mock("../../src/common/token/createToken");
jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock("../../src/config/getConfig", () => ({
  getConfig: jest.fn().mockReturnValue({
    SIGNING_KEY_ID: "test-key-id",
    STATUS_LIST_BUCKET_NAME: "test-bucket-name",
    SELF_URL: "https://test-self-url.com",
  }),
}));

describe("handler", () => {
  const mockContext = {} as Context;
  const mockTimestamp = 1234567890123;
  const mockCreatedToken = "created-token-with-signature";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
    jest.mocked(createToken).mockResolvedValue(mockCreatedToken);
    jest.mocked(putObject).mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call logger.addContext with context", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 5,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.addContext).toHaveBeenCalledTimes(1);
  });

  it("should log revocation started", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 5,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      LogMessage.REVOKE_LAMBDA_STARTED,
    );
  });

  it("should throw error when event body is null", async () => {
    const event = { body: null } as unknown as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "Event body is missing",
    );
  });

  it("should throw error when JWT has invalid format", async () => {
    const event = { body: "not.a.valid.token" } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "Failed to extract uri and idx from JWT: SyntaxError: Unexpected end of JSON input",
    );
  });

  it("should throw error when JWT payload is not valid JSON", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const invalidPayload = Buffer.from("not json").toString("base64url");
    const jwt = `${header}.${invalidPayload}.signature`;
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "Failed to decode or parse JWT payload",
    );
  });

  it("should throw error when JWT payload is not an object", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(JSON.stringify("string payload")).toString(
      "base64url"
    );
    const jwt = `${header}.${payload}.signature`;
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload must be an object",
    );
  });

  it("should throw error when uri is missing", async () => {
    const jwt = createTestJwt({ idx: 0 } as { uri: string; idx: number });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload 'uri' claim must be a non-empty string",
    );
  });

  it("should throw error when uri is an empty string", async () => {
    const jwt = createTestJwt({ uri: "", idx: 0 });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload 'uri' claim must be a non-empty string",
    );
  });

  it("should throw error when uri is not a string", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ uri: 123, idx: 0 })
    ).toString("base64url");
    const jwt = `${header}.${payload}.signature`;
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload 'uri' claim must be a non-empty string",
    );
  });

  it("should throw error when idx is missing", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
    } as { uri: string; idx: number });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload 'idx' claim must be a number",
    );
  });

  it("should throw error when idx is not a number", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        uri: "https://status-list.example.com/status",
        idx: "0",
      })
    ).toString("base64url");
    const jwt = `${header}.${payload}.signature`;
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload 'idx' claim must be a number",
    );
  });

  it("should throw error when idx is not a number", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        uri: "https://status-list.example.com/status",
        idx: "0",
      })
    ).toString("base64url");
    const jwt = `${header}.${payload}.signature`;
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "JWT payload 'idx' claim must be a number",
    );
  });

  it("should call createToken with correct parameters", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({
        selfUrl: "https://test-self-url.com",
        uri: "https://status-list.example.com/path/to/status",
        keyId: "test-key-id",
        statusList: expect.objectContaining({
          bits: 2,
        }),
      }),
    );
  });

  it("should use correct status list for idx 0", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({
        statusList: { bits: 2, lst: "eNpzdAEAAMgAhg" },
      }),
    );
  });

  it("should use alternate status list for non-zero idx", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 5,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({
        statusList: { bits: 2, lst: "eNqTSwcAAKUAhg" },
      }),
    );
  });

  it("should propagate errors during status list token creation", async () => {
    const tokenError = new Error("Token creation failed");
    jest.mocked(createToken).mockRejectedValueOnce(tokenError);

    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "Token creation failed",
    );
  });

  it("should upload the token to S3 with correct parameters", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/my-status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(putObject).toHaveBeenCalledWith(
      "test-bucket-name",
      "path/to/my-status",
      mockCreatedToken,
    );
  });

  it("should extract object key from uri pathname", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/nested/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(putObject).toHaveBeenCalledWith(
      expect.any(String),
      "nested/path/to/status",
      expect.any(String),
    );
  });

  it("should propagate errors during S3 upload", async () => {
    const s3Error = new Error("S3 upload failed");
    jest.mocked(putObject).mockRejectedValueOnce(s3Error);

    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await expect(handler(event, mockContext)).rejects.toThrow(
      "S3 upload failed",
    );
  });

  it("should log revocation completed", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    await handler(event, mockContext);

    expect(logger.info).toHaveBeenLastCalledWith(
      LogMessage.REVOKE_LAMBDA_COMPLETED,
    );
  });

  it("should process a valid revocation request successfully", async () => {
    const jwt = createTestJwt({
      uri: "https://status-list.example.com/path/to/status",
      idx: 0,
    });
    const event = { body: jwt } as APIGatewayProxyEvent;

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(202);
    expect(result.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(result.body);
    expect(body.message).toBe("Request processed for revocation");
    expect(body.revokedAt).toBe(mockTimestamp);
  });

  const createTestJwt = (payload: any) => {
    const header = Buffer.from(
      JSON.stringify({ alg: "ES256", typ: "JWT" }),
    ).toString("base64url");
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = "test-signature";
    return `${header}.${payloadStr}.${signature}`;
  };
});
