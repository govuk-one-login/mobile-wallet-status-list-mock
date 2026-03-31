import { ChildProcess, spawn } from "child_process";
import path from "path";
import { waitForPort } from "./helpers/waitForPort";

const SAM_PORT = 3000;
const PRISM_PORT = 4010;
const PRISM_BASE_URL = `http://127.0.0.1:${PRISM_PORT}`;

const prismBin = path.resolve(process.cwd(), "node_modules/.bin/prism");
const apiSpec = path.resolve(process.cwd(), "openApiSpec/crs/crs-private-spec.yaml");

async function postToIssue(
  body: string,
  contentType: string,
): Promise<Response> {
  return fetch(`${PRISM_BASE_URL}/issue`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

describe("POST /issue — Prism proxy conformance (real Lambda)", () => {
  let prism: ChildProcess;

  beforeAll(async () => {
    // Fail fast if the local stack is not running.
    // waitForPort is given a short timeout so the error surfaces immediately
    // rather than after a long wait. Run `npm run dev` to start the stack.
    try {
      await waitForPort(SAM_PORT, "127.0.0.1", 2000);
    } catch {
      throw new Error(
        `SAM local API is not running on port ${SAM_PORT}. ` +
          "Start the local stack with `npm run dev` before running these tests.",
      );
    }

    prism = spawn(
      prismBin,
      [
        "proxy",
        apiSpec,
        `http://127.0.0.1:${SAM_PORT}`,
        "--errors",
        "--port",
        String(PRISM_PORT),
      ],
      { stdio: "pipe" },
    );

    await waitForPort(PRISM_PORT);

    // Trigger the Lambda cold start before assertions begin. SAM local
    // initialises the Lambda container on the first invocation, which can take
    // several seconds. Warming up here means individual test cases see
    // consistent response times and are not at risk of timing out during
    // container initialisation.
    await postToIssue("warmup.jwt.token", "application/jwt");
  }, 60000);

  afterAll(() => {
    prism?.kill();
  });

  describe("Request validation", () => {
    it("proxies a request with Content-Type: application/jwt", async () => {
      const res = await postToIssue("a.valid.jwt", "application/jwt");
      expect(res.status).toBe(200);
    });

    it("rejects Content-Type: application/json with 422", async () => {
      const res = await postToIssue("{}", "application/json");
      expect(res.status).toBe(422);
    });

    it("rejects Content-Type: text/plain with 422", async () => {
      const res = await postToIssue("some-text", "text/plain");
      expect(res.status).toBe(422);
    });
  });

  describe("Response schema validation", () => {
    it("200 response contains idx as a number", async () => {
      const res = await postToIssue("a.valid.jwt", "application/jwt");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(typeof body.idx).toBe("number");
      expect(body.idx).toBeGreaterThanOrEqual(0);
    });

    it("200 response contains uri as a string", async () => {
      const res = await postToIssue("a.valid.jwt", "application/jwt");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(typeof body.uri).toBe("string");
    });
  });
});