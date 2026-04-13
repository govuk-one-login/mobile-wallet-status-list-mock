import { issueConformanceSuite } from "../../testSuits/issueConformanceSuite";

const UPSTREAM_URL = process.env.UPSTREAM_URL;
if (!UPSTREAM_URL)
  throw new Error("UPSTREAM_URL environment variable is not set.");

issueConformanceSuite({
  upstream: UPSTREAM_URL,
  beforeAllTimeout: 30000,
  setup: async () => {
    // Fail fast if the deployed endpoint is not reachable.
    const reachable = await fetch(`${UPSTREAM_URL}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/jwt" },
      body: "healthcheck.token",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!reachable) {
      throw new Error(
        `Upstream at ${UPSTREAM_URL} is not reachable. ` +
          "Check the service is deployed and UPSTREAM_URL is correct.",
      );
    }
  },
});
