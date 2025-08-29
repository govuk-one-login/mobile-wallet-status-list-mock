import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { getRequestBody, handler } from "../../src/functions/revokeHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";
import { putObject } from "../../src/common/aws/s3";
import { derToJose } from "ecdsa-sig-formatter";
import { sign } from "../../src/common/aws/kms";

jest.mock("../../src/common/aws/kms");
jest.mock("../../src/common/aws/s3");
jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock("ecdsa-sig-formatter");

process.env.SIGNING_KEY_ID = "test-key-id";
process.env.STATUS_LIST_BUCKET_NAME = "test-bucket-name";

describe("handler", () => {
  const jwt =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnb3YudWsiLCJpYXQiOjE3NTY0NTcxMjAsImV4cCI6MTc4Nzk5MzEyMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImlkeCI6IjAiLCJ1cmkiOiJodHRwczovL3Rlc3Qtc3RhdHVzLWxpc3QuY29tL3QvMzY5NDAxOTAtZTZhZi00MmQwLTkxODEtNzRjOTQ0ZGM0YWY3In0.J-7oGoyXoTh8ljXiRpFs-xSikAV1lYAD5f1npp9dmVU";

  const mockEvent = { body: jwt } as APIGatewayProxyEvent;
  const mockContext = {} as Context;
  const mockTimestamp = 1234567890123;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
    jest.mocked(sign).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest.mocked(derToJose).mockReturnValue("mockJoseSignature");
    jest.mocked(putObject).mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 202 response with expected body", async () => {
    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      statusCode: 202,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Request processed for revocation",
        revokedAt: mockTimestamp,
      }),
    });

    expect(putObject).toHaveBeenCalledWith(
      "test-bucket-name",
      "36940190-e6af-42d0-9181-74c944dc4af7",
      "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5LWlkIiwidHlwIjoic3RhdHVzbGlzdCtqd3QifQ.eyJpYXQiOjEyMzQ1Njc4OTAsImV4cCI6MTIzNzE1OTg5MCwic3RhdHVzX2xpc3QiOnsiYml0cyI6MiwibHN0IjoiZU5xVFN3Y0FBS1VBaGcifSwic3ViIjoiaHR0cHM6Ly90ZXN0LXN0YXR1cy1saXN0LmNvbS90LzM2OTQwMTkwLWU2YWYtNDJkMC05MTgxLTc0Yzk0NGRjNGFmNyIsInR0bCI6MjU5MjAwMH0.mockJoseSignature",
    );
    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.REVOKE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(
      LogMessage.REVOKE_LAMBDA_COMPLETED,
    );
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(Date.now).toHaveBeenCalledTimes(2);
  });

  it("should propagate errors during S3 upload", async () => {
    jest.mocked(putObject).mockRejectedValue(new Error("S3 upload failed"));
    await expect(handler(mockEvent, mockContext)).rejects.toThrow(
      "S3 upload failed",
    );
  });
});

describe("getRequestBody", () => {
  it("should throw an error if the JWT is null", () => {
    expect(() => getRequestBody(null)).toThrow("Request body is empty");
  });

  it("should throw an error if the JWT is missing the uri claim", () => {
    const invalidJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.sM_g-e2a0h5z7g7g-e2a0h5z7g7g";
    expect(() => getRequestBody(invalidJwt)).toThrow(
      "JWT payload is missing 'uri' or 'idx' claim",
    );
  });

  it("should return the uri claim if the JWT is valid", () => {
    const validJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmkiOiJodHRwOi8vZXhhbXBsZS5jb20iLCJpZHgiOjF9.sM_g-e2a0h5z7g7g-e2a0h5z7g7g";
    expect(getRequestBody(validJwt).uri).toBe("http://example.com");
  });

  it("should return the idx claim if the JWT is valid", () => {
    const validJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmkiOiJodHRwOi8vZXhhbXBsZS5jb20iLCJpZHgiOjF9.sM_g-e2a0h5z7g7g-e2a0h5z7g7g";
    expect(getRequestBody(validJwt).idx).toBe(1);
  });
});
