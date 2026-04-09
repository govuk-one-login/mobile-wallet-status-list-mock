import { ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { expectStatus } from "../helpers/expectStatus";
import { waitForPort } from "../helpers/waitForPort";

const PRISM_PORT = 4010;
const PRISM_BASE_URL = `http://127.0.0.1:${PRISM_PORT}`;

const prismBin = path.resolve(process.cwd(), "node_modules/.bin/prism");
const apiSpec = path.resolve(
  process.cwd(),
  "openApiSpec/crs/crs-private-spec.yaml",
);

// Minimal JWT required by the revoke handler. Signature is not verified.
// Decoded payload: { iss, iat, exp, idx: 0, uri }
const REVOKE_JWT =
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnb3YudWsiLCJpYXQiOjE3NTY0NTcxMjAsImV4cCI6MTc4Nzk5MzEyMCwiaWR4IjowLCJ1cmkiOiJodHRwczovL3Rlc3Qtc3RhdHVzLWxpc3QuY29tL3QvMzY5NDAxOTAtZTZhZi00MmQwLTkxODEtNzRjOTQ0ZGM0YWY3In0.test-signature";

export interface SuiteConfig {
  upstream: string;
  beforeAllTimeout: number;
  setup: () => Promise<void>;
}

async function postToRevoke(
  body: string,
  contentType?: string,
): Promise<Response> {
  return fetch(`${PRISM_BASE_URL}/revoke`, {
    method: "POST",
    headers: contentType ? { "Content-Type": contentType } : {},
    body,
  });
}

export function revokeConformanceSuite(config: SuiteConfig): void {
  describe("POST /revoke — Prism proxy conformance", () => {
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
        const res = await postToRevoke(REVOKE_JWT, "application/jwt");
        await expectStatus(res, 202);
      });

      it("rejects a request with no Content-Type with 422", async () => {
        const res = await postToRevoke(REVOKE_JWT);
        await expectStatus(res, 422);
      });

      it("rejects Content-Type: application/json with 422", async () => {
        const res = await postToRevoke("{}", "application/json");
        await expectStatus(res, 422);
      });

      it("rejects Content-Type: text/plain with 422", async () => {
        const res = await postToRevoke("some-text", "text/plain");
        await expectStatus(res, 422);
      });
    });

    describe("Response schema validation", () => {
      it("202 response contains message as 'Request processed for revocation'", async () => {
        const res = await postToRevoke(REVOKE_JWT, "application/jwt");
        const body = await res.json();

        await expectStatus(res, 202);
        expect(body.message).toBe("Request processed for revocation");
      });

      it("202 response contains revokedAt as a number", async () => {
        const res = await postToRevoke(REVOKE_JWT, "application/jwt");
        const body = await res.json();

        await expectStatus(res, 202);
        expect(typeof body.revokedAt).toBe("number");
        expect(body.revokedAt).toBeGreaterThanOrEqual(0);
      });
    });
  });
}
