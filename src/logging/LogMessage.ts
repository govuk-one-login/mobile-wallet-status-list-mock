import { LogAttributes } from "@aws-lambda-powertools/logger/types";

export class LogMessage implements LogAttributes {
  static readonly ISSUE_LAMBDA_STARTED = new LogMessage(
    "ISSUE_LAMBDA_STARTED",
    "Issue Lambda handler processing has started.",
    "N/A",
  );

  static readonly ISSUE_LAMBDA_COMPLETED = new LogMessage(
    "ISSUE_LAMBDA_COMPLETED",
    "Issue Lambda handler processing has completed.",
    "N/A",
  );

  static readonly REVOKE_LAMBDA_STARTED = new LogMessage(
    "REVOKE_LAMBDA_STARTED",
    "Revoke Lambda handler processing has started.",
    "N/A",
  );

  static readonly REVOKE_LAMBDA_COMPLETED = new LogMessage(
    "REVOKE_LAMBDA_COMPLETED",
    "Revoke Lambda handler processing has completed.",
    "N/A",
  );

  static readonly JWKS_LAMBDA_STARTED = new LogMessage(
    "JWKS_LAMBDA_STARTED",
    "JWKS Lambda handler processing has started.",
    "N/A",
  );

  static readonly JWKS_LAMBDA_COMPLETED = new LogMessage(
    "JWKS_LAMBDA_COMPLETED",
    "JWKS Lambda handler processing has completed.",
    "N/A",
  );

  private constructor(
    public readonly messageCode: string,
    public readonly message: string,
    public readonly userImpact: string,
  ) {}

  [key: string]: string;
}
