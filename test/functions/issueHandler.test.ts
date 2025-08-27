import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { createToken, handler } from "../../src/functions/issueHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";
import * as crypto from "crypto";
import { sign } from "../../src/common/aws/kms";
import { upload } from "../../src/common/aws/s3";
import { derToJose } from "ecdsa-sig-formatter";

jest.mock("../../src/common/aws/kms");
jest.mock("../../src/common/aws/s3");
jest.mock("crypto");
jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock("ecdsa-sig-formatter");

process.env.SIGNING_KEY_ID = "test-key-id";
process.env.SELF_URL = "https://test-status-list.com";
process.env.STATUS_LIST_BUCKET_NAME = "test-bucket-name";

const statusListMock = { bits: 2, lst: "test-lst" };

describe("handler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("36940190-e6af-42d0-9181-74c944dc4af7");
    jest.spyOn(global.Date, "now").mockReturnValue(Date.parse("2025-08-21"));
    jest.mocked(sign).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest.mocked(derToJose).mockReturnValue("mockJoseSignature");
    jest.mocked(upload).mockResolvedValue();
  });

  it("should return 200 response with expected body", async () => {
    const token = await createToken(
      statusListMock,
      process.env.SELF_URL!,
      process.env.SIGNING_KEY_ID!,
    );
    const result = await handler(mockEvent, mockContext);
    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idx: 0,
        uri: "https://test-status-list.com/t/36940190-e6af-42d0-9181-74c944dc4af7",
      }),
    });
    expect(token).toBeDefined();
    expect(token).toContain(".");
    expect(sign).toHaveBeenCalledWith(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5LWlkIiwidHlwIjoic3RhdHVzbGlzdCtqd3QifQ.eyJpYXQiOjE3NTU3MzQ0MDAsImV4cCI6MTc1ODMyNjQwMCwic3RhdHVzX2xpc3QiOnsiYml0cyI6MiwibHN0IjoidGVzdC1sc3QifSwic3ViIjoiaHR0cHM6Ly90ZXN0LXN0YXR1cy1saXN0LmNvbSIsInR0bCI6MjU5MjAwMH0",
      "test-key-id",
    );
    expect(derToJose).toHaveBeenCalledWith("AQID", "ES256");
    expect(upload).toHaveBeenCalledWith(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5LWlkIiwidHlwIjoic3RhdHVzbGlzdCtqd3QifQ.eyJpYXQiOjE3NTU3MzQ0MDAsImV4cCI6MTc1ODMyNjQwMCwic3RhdHVzX2xpc3QiOnsiYml0cyI6MiwibHN0IjoiZU5wemNBRUFBTVlBaFEifSwic3ViIjoiaHR0cHM6Ly90ZXN0LXN0YXR1cy1saXN0LmNvbS90LzM2OTQwMTkwLWU2YWYtNDJkMC05MTgxLTc0Yzk0NGRjNGFmNyIsInR0bCI6MjU5MjAwMH0.mockJoseSignature",
      "test-bucket-name",
      "36940190-e6af-42d0-9181-74c944dc4af7",
    );
    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_COMPLETED);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });

  it("should propagate errors during S3 upload", async () => {
    jest.mocked(upload).mockRejectedValue(new Error("S3 upload failed"));
    await expect(handler(mockEvent, mockContext)).rejects.toThrow(
      "S3 upload failed",
    );
  });

  it("should propagate errors during token creation", async () => {
    jest.mocked(sign).mockRejectedValue(new Error("Token creation failed"));
    await expect(handler(mockEvent, mockContext)).rejects.toThrow(
      "Token creation failed",
    );
  });
});
