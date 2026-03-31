import { waitForPort } from "../../helpers/waitForPort";
import { revokeConformanceSuite } from "../../testSuits/revokeConformanceSuite";

const SAM_PORT = 3000;
const SAM_HOST = "127.0.0.1";

revokeConformanceSuite({
  upstream: `http://${SAM_HOST}:${SAM_PORT}`,
  beforeAllTimeout: 60000,
  setup: async () => {
    // Fail fast if the local stack is not running.
    // waitForPort is given a short timeout so the error surfaces immediately
    // rather than after a long wait. Run `npm run dev` to start the stack.
    try {
      await waitForPort(SAM_PORT, SAM_HOST, 2000);
    } catch {
      throw new Error(
        `SAM local API is not running on port ${SAM_PORT}. ` +
          "Start the local stack with `npm run dev` before running these tests.",
      );
    }

    // Trigger the Lambda cold start before assertions begin. SAM local
    // initialises the Lambda container on the first invocation, which can take
    // several seconds. Warming up here means individual test cases see
    // consistent response times and are not at risk of timing out during
    // container initialisation.
    await fetch(`http://127.0.0.1:${SAM_PORT}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/jwt" },
      body: "warmup.jwt.token",
    });
  },
});