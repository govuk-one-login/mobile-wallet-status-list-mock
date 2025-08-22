import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../../src/functions/issueHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";
import * as crypto from "crypto";
import { sign } from "../../src/common/aws/kms";
import { upload } from "../../src/common/aws/s3";

jest.mock("../../src/common/aws/kms");
jest.mock("../../src/common/aws/s3");
jest.mock("crypto");
jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));

process.env.SIGNING_KEY_ID = "test-key-id";
process.env.SELF_URL = "https://test-status-list.com";
process.env.STATUS_LIST_BUCKET_NAME = "test-bucket-name";
const bucket = "bucketName";
const body = "token";
const key = "key";

describe("handler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;
  let uploadMock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0);
    jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("36940190-e6af-42d0-9181-74c944dc4af7");
    jest.spyOn(global.Date, "now").mockReturnValue(Date.parse("2025-08-21"));
    jest.mocked(sign).mockResolvedValue(new Uint8Array([1, 2, 3]));
    uploadMock = jest.mocked(upload).mockResolvedValue();
  });

  it("should return 200 response with expected body", async () => {
    const result = await handler(mockEvent, mockContext);
    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idx: 0,
        uri: process.env.SELF_URL + "/t/36940190-e6af-42d0-9181-74c944dc4af7",
      }),
    });
    await expect(upload(body, bucket, key)).resolves.not.toThrow();
    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_COMPLETED);
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(uploadMock).toHaveBeenCalled();
  });

  it("should handle errors during S3 upload", async () => {
    uploadMock.mockRejectedValue(new Error("S3 upload failed"));
    await expect(handler(mockEvent, mockContext)).rejects.toThrow(
      "S3 upload failed",
    );
  });

  it("should handle errors during token creation", async () => {
    jest.mocked(sign).mockRejectedValue(new Error("Token creation failed"));
    await expect(handler(mockEvent, mockContext)).rejects.toThrow(
      "Token creation failed",
    );
  });
});
