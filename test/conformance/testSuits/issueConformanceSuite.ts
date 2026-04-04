import { ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { waitForPort } from "../helpers/waitForPort";

const PRISM_PORT = 4010;
const PRISM_BASE_URL = `http://127.0.0.1:${PRISM_PORT}`;

const prismBin = path.resolve(process.cwd(), "node_modules/.bin/prism");
const apiSpec = path.resolve(
  process.cwd(),
  "openApiSpec/crs/crs-private-spec.yaml",
);

export interface SuiteConfig {
  upstream: string;
  beforeAllTimeout: number;
  // Health check and optional warm-up — called before Prism is spawned.
  setup: () => Promise<void>;
}

async function postToIssue(
  body: string,
  contentType?: string,
): Promise<Response> {
  return fetch(`${PRISM_BASE_URL}/issue`, {
    method: "POST",
    headers: contentType ? { "Content-Type": contentType } : {},
    body,
  });
}

export function issueConformanceSuite(config: SuiteConfig): void {
  describe("POST /issue — Prism proxy conformance", () => {
    let prism: ChildProcess;

    beforeAll(async () => {
      await config.setup();

      prism = spawn(
        prismBin,
        [
          "proxy",
          apiSpec,
          config.upstream,
          "--errors",
          "--port",
          String(PRISM_PORT),
        ],
        { stdio: "pipe" },
      );

      await waitForPort(PRISM_PORT);
    }, config.beforeAllTimeout);

    afterAll(() => {
      prism?.kill();
    });

    describe("Request validation", () => {
      it("proxies a request with Content-Type: application/jwt", async () => {
        const res = await postToIssue("a.valid.jwt", "application/jwt");
        expect(res.status).toBe(200);
      });

      it("rejects a request with no Content-Type with 422", async () => {
        const res = await postToIssue("a.valid.jwt");
        expect(res.status).toBe(422);
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
}
