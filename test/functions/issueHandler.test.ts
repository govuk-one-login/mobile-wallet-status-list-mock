import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../../src/functions/issueHandler";
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 response with expected body", async () => {
    const result = await handler(event, context);

    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idx: 0,
        uri: "uri",
      }),
    });
    expect(logger.addContext).toHaveBeenCalledWith(context);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.ISSUE_LAMBDA_COMPLETED);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });
});
