import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../../src/functions/jwksHandler";
import { logger } from "../../src/logging/logger";
import { LogMessage } from "../../src/logging/LogMessage";

jest.mock("../../src/logging/logger", () => ({
  logger: {
    addContext: jest.fn(),
    info: jest.fn(),
  },
}));

describe("handler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log start and completion messages", async () => {
    const result = await handler(mockEvent, mockContext);

    expect(result).toBeUndefined();
    expect(logger.addContext).toHaveBeenCalledWith(mockContext);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.JWKS_LAMBDA_STARTED);
    expect(logger.info).toHaveBeenCalledWith(LogMessage.JWKS_LAMBDA_COMPLETED);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });
});
