import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../../src/functions/revokeHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";

jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));

describe("handler", () => {
  const event = {} as APIGatewayProxyEvent;
  const context = {} as Context;
  const mockTimestamp = 1234567890123;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 202 response with expected body", async () => {
    const result = await handler(event, context);

    expect(result).toEqual({
      statusCode: 202,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Request processed for revocation",
        revokedAt: mockTimestamp,
      }),
    });
    expect(logger.addContext).toHaveBeenCalledWith(context);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.REVOKE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(
      LogMessage.REVOKE_LAMBDA_COMPLETED,
    );
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(Date.now).toHaveBeenCalledTimes(1);
  });
});
