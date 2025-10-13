import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../../src/functions/issueHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";
import * as crypto from "crypto";
import { createToken } from "../../src/common/token/createToken";
import { putObject } from "../../src/common/aws/s3";

jest.mock("crypto");
jest.mock("../../src/common/token/createToken");
jest.mock("../../src/common/aws/s3");
jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));

process.env.SIGNING_KEY_ID = "test-key-id";
process.env.SELF_URL = "https://test-status-list.com";
process.env.STATUS_LIST_BUCKET_NAME = "test-bucket-name";

describe("handler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0);
    jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("36940190-e6af-42d0-9181-74c944dc4af7");
    jest.spyOn(global.Date, "now").mockReturnValue(Date.parse("2025-08-21"));
    jest.mocked(createToken).mockResolvedValue("mockStatusListJwt");
    jest.mocked(putObject).mockResolvedValue();
  });

  it("should process a valid issue request successfully", async () => {
    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idx: 0,
        uri: "https://test-status-list.com/t/36940190-e6af-42d0-9181-74c944dc4af7",
      }),
    });
    expect(createToken).toHaveBeenCalledWith({
      keyId: "test-key-id",
      selfUrl: "https://test-status-list.com",
      statusList: { bits: 2, lst: "eNpzcAEAAMYAhQ" },
      uri: "https://test-status-list.com/t/36940190-e6af-42d0-9181-74c944dc4af7",
    });
    expect(putObject).toHaveBeenCalledWith(
      "test-bucket-name",
      "t/36940190-e6af-42d0-9181-74c944dc4af7",
      "mockStatusListJwt",
    );
    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_COMPLETED);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });

  it("should propagate errors thrown by putObject function", async () => {
    jest.mocked(putObject).mockRejectedValue(new Error("S3 upload failed"));

    await expect(handler(mockEvent, mockContext)).rejects.toThrow(
      "S3 upload failed",
    );
  });

  it("should propagate errors thrown by createToken function", async () => {
    jest.mocked(createToken).mockRejectedValue(new Error("Some error"));

    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Some error");
  });
});
