import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger } from "../logging/logger";
import { LogMessage } from "../logging/LogMessage";

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<void> {
  logger.addContext(context);
  logger.info(LogMessage.JWKS_LAMBDA_STARTED);
  logger.info(LogMessage.JWKS_LAMBDA_COMPLETED);
}
