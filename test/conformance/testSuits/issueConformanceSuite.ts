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

export interface SuiteConfig {
  upstream: string;
  beforeAllTimeout: number;
  setup: () => Promise<void>;
}

async function postToIssue(body: string, contentType?: string) {
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

    it("proxies a valid request and gets a valid response", async () => {
      const res = await postToIssue("a.valid.jwt", "application/jwt");
      const body = await res.json();

      await expectStatus(res, 200);
      expect(typeof body.idx).toBe("number");
      expect(body.idx).toBeGreaterThanOrEqual(0);
      expect(typeof body.uri).toBe("string");
    });
  });
}
