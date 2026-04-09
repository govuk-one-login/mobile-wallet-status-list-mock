import { ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { expectStatus } from "../helpers/expectStatus";
import { waitForPort } from "../helpers/waitForPort";

// using port 4011 to avoid conflicts as 4010 is used by the private spec suites
const PRISM_PORT = 4011;
const PRISM_BASE_URL = `http://127.0.0.1:${PRISM_PORT}`;

const prismBin = path.resolve(process.cwd(), "node_modules/.bin/prism");
const apiSpec = path.resolve(
  process.cwd(),
  "openApiSpec/crs/crs-public-spec.yaml",
);

export interface PublicSuiteConfig {
  upstream: string;
  beforeAllTimeout: number;
  setup: () => Promise<string>;
}

export function publicConformanceSuite(config: PublicSuiteConfig): void {
  describe("GET /t/{statusListIdentifier} — Prism proxy conformance (public spec)", () => {
    let prism: ChildProcess;
    let identifier: string;

    beforeAll(async () => {
      identifier = await config.setup();

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

    describe("Response schema validation", () => {
      it("200 response contains Content-Type: application/statuslist+jwt", async () => {
        const res = await fetch(`${PRISM_BASE_URL}/t/${identifier}`);

        await expectStatus(res, 200);
        expect(res.headers.get("content-type")).toContain(
          "application/statuslist+jwt",
        );
      });

      it("200 response body passes Prism schema validation", async () => {
        const res = await fetch(`${PRISM_BASE_URL}/t/${identifier}`);

        await expectStatus(res, 200);
      });
    });
  });
}
