import { publicConformanceSuite } from "../../testSuits/publicConformanceSuite";

const UPSTREAM_URL = process.env.UPSTREAM_URL;
if (!UPSTREAM_URL)
  throw new Error("UPSTREAM_URL environment variable is not set.");

publicConformanceSuite({
  upstream: UPSTREAM_URL,
  beforeAllTimeout: 30000,
  setup: async () => {
    // Issue a token to populate the status list bucket and verify the upstream is reachable.
    const reachable = await fetch(`${UPSTREAM_URL}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/jwt" },
      body: "seed.jwt.token",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!reachable) {
      throw new Error(
        `Upstream at ${UPSTREAM_URL} is not reachable. ` +
          "Check the service is deployed and UPSTREAM_URL is correct.",
      );
    }

    if (!reachable.ok) {
      throw new Error(
        `Failed to seed S3 via /issue: received ${reachable.status}`,
      );
    }

    const { uri } = await reachable.json();

    // uri is e.g. "https://status-list-mock.wallet-onboarding.build.account.gov.uk/t/uuid"
    // The status list identifier is the final path segment after /t/
    const identifier = new URL(uri).pathname.split("/").pop();
    if (!identifier) {
      throw new Error(
        `Could not extract status list identifier from uri: ${uri}`,
      );
    }

    return identifier;
  },
});
