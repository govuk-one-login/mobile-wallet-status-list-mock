import { ChildProcess, spawn } from "child_process";
import path from "path";
import { waitForPort } from "./helpers/waitForPort";

const UPSTREAM_URL = process.env.UPSTREAM_URL;
const PRISM_PORT = 4010;
const PRISM_BASE_URL = `http://127.0.0.1:${PRISM_PORT}`;

const prismBin = path.resolve(process.cwd(), "node_modules/.bin/prism");
const apiSpec = path.resolve(process.cwd(), "api-spec.yaml");

if (!UPSTREAM_URL) {
  throw new Error("UPSTREAM_URL environment variable is not set.");
}

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

describe("POST /issue — Prism proxy conformance (deployed Lambda)", () => {
  let prism: ChildProcess;

  beforeAll(async () => {
    // Fail fast if the deployed endpoint is not reachable. Uses a short
    // AbortSignal timeout rather than waitForPort because the upstream is
    // HTTPS, not a raw TCP port.
    const reachable = await fetch(`${UPSTREAM_URL}/issue`, {
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

    prism = spawn(
      prismBin,
      [
        "proxy",
        apiSpec,
        UPSTREAM_URL,
        "--errors",
        "--port",
        String(PRISM_PORT),
      ],
      { stdio: "pipe" },
    );

    // No warm-up needed — the deployed Lambda is always warm.
    await waitForPort(PRISM_PORT);
  }, 30000);

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