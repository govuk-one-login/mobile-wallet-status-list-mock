import { revokeConformanceSuite } from "../../testSuits/revokeConformanceSuite";

const UPSTREAM_URL = process.env.UPSTREAM_URL;
if (!UPSTREAM_URL) throw new Error("UPSTREAM_URL environment variable is not set.");

revokeConformanceSuite({
  upstream: UPSTREAM_URL,
  beforeAllTimeout: 30000,
  setup: async () => {
    // Fail fast if the deployed endpoint is not reachable. Uses a short
    // AbortSignal timeout rather than waitForPort because the upstream is
    // HTTPS, not a raw TCP port.
    const reachable = await fetch(`${UPSTREAM_URL}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/jwt" },
      body: "healthcheck.token",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!reachable) {
      throw new Error(
        `Upstream at ${UPSTREAM_URL} is not reachable. ` +
          "Check that the environment is deployed and UPSTREAM_URL is correct.",
      );
    }
  },
});