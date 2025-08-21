import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler} from "../../src/functions/issueHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";
import * as crypto from 'crypto';

jest.mock('crypto');
jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));

process.env.SIGNING_KEY_ID = "test-key-id";
process.env.SELF_URL = "https://test-status-list.com";

describe("handler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0);
    jest.spyOn(crypto, "randomUUID").mockReturnValue("36940190-e6af-42d0-9181-74c944dc4af7");
    jest
      .spyOn(global.Date, 'now').mockReturnValue(Date.parse('2025-08-21'))
  });

  it("should return 200 response with expected body", async () => {
    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idx: 0,
        uri: process.env.SELF_URL + "/t/36940190-e6af-42d0-9181-74c944dc4af7"
      }),
    });
    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_COMPLETED);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });
});
