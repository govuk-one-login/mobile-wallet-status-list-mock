import { Logger } from "@aws-lambda-powertools/logger";
import { logger } from "../../src/logging/logger";

describe("logger", () => {
  it("should initialise with the service name from environment", () => {
    expect(logger).toBeInstanceOf(Logger);
    expect((logger as any).serviceName).toBe(
      process.env.POWERTOOLS_SERVICE_NAME,
    );
  });
});
