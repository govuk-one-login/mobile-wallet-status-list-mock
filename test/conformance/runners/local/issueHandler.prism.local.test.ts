import { waitForPort } from "../../helpers/waitForPort";
import { issueConformanceSuite } from "../../testSuits/issueConformanceSuite";

const SAM_PORT = 3000;
const SAM_HOST = "127.0.0.1";

issueConformanceSuite({
  upstream: `http://${SAM_HOST}:${SAM_PORT}`,
  beforeAllTimeout: 60000,
  setup: async () => {
    // Fail fast if the service is not running.
    try {
      await waitForPort(SAM_PORT, SAM_HOST, 2000);
    } catch {
      throw new Error(
        `SAM local API is not running on port ${SAM_PORT}. ` +
          "Start the service locally with `npm run dev` before running these tests.",
      );
    }

    // Trigger the Lambda cold start before assertions begin. 
    await fetch(`http://127.0.0.1:${SAM_PORT}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/jwt" },
      body: "warmup.jwt.token",
    });
  },
});
