# Conformance Tests

Prism proxy-mode conformance tests that verify the deployed service matches its OAS
contract end-to-end.

## How it works

Prism runs in proxy mode between the test and the real service. It validates every
request and response against the OAS spec and rejects anything that violates the
contract before it reaches (or leaves) the upstream:

```
Test (Jest) → Prism proxy (OAS enforcer) → deployed service → Prism → Test
```

The test code only asserts HTTP status codes and response shapes. Prism does the OAS
enforcement — no spec logic is duplicated in the tests.

## Structure

```
test/conformance/
  helpers/                      Wait for port utility
  testSuits/                    Factory functions, add test cases here
  runners/                      Config and runtime setup 
    local/                      Runs against SAM local (localhost:3000)
    ci/                         Runs against deployed service (UPSTREAM_URL)
```

Each suite is a factory function. Runner files call the factory with environment-specific
setup (upstream URL, health check, warm-up). This keeps the test cases defined once and
shared between local and CI runners.

## Test suites

| Suite | Spec | Port | Covers |
|---|---|---|---|
| `issueConformanceSuite.ts` | `crs-private-spec.yaml` | 4010 | `POST /issue` — Content-Type enforcement, 200 response schema |
| `revokeConformanceSuite.ts` | `crs-private-spec.yaml` | 4010 | `POST /revoke` — Content-Type enforcement, 202 response schema |
| `publicConformanceSuite.ts` | `crs-public-spec.yaml` | 4011 | `GET /t/{id}` — response Content-Type, schema validation |

The private spec suites share port 4010 and run serially (`maxWorkers: 1` in
`jest.conformance.config.ts`) to avoid port conflicts. The public spec suite uses port
4011.

## Running locally

Prerequisites: Docker running, SAM artefact built (`npm run build`), `.env.json` present.

```bash
# Terminal 1 — start LocalStack + SAM local
npm run build
npm run dev

# Terminal 2 — run conformance tests against localhost:3000
npm run test:conformance:local
```

The local runners send a warm-up request in `beforeAll` to trigger the Lambda cold start
before assertions begin. The Jest timeout is 60s to accommodate this.

## Running in CI

The conformance workflow targets a deployed environment via `UPSTREAM_URL`. It can be
triggered manually from the GitHub Actions UI with a choice of `integration` or `build`.

To run locally against a deployed environment:

```bash
UPSTREAM_URL=https://status-list-mock.wallet-onboarding.build.account.gov.uk \
  npm run test:conformance:ci
```

The CI runners check the upstream is reachable in `beforeAll` and fail immediately with
a clear error if not.

## OAS drift detection

The CRS spec copies in this repo (`crs-private-spec.yaml`, `crs-public-spec.yaml`) must
stay in sync with the upstream CRS service. The `check-oas-for-drift` workflow runs daily
and on every PR — it clones the `crs-backend` repo and uses
[oasdiff](https://github.com/oasdiff/oasdiff) to diff the upstream spec against the local
copy. Any difference fails the workflow and triggers a Slack alert.

Conformance tests depend on the spec copies being accurate. If the upstream spec changes
and the local copy is not updated, Prism will enforce stale rules — tests may pass against
a service that no longer matches the real CRS contract, or fail for the wrong reason.

**If both `check-oas-for-drift` and the conformance tests fail at the same time, update
the spec copy first.** The conformance failure is likely a symptom of the drift.

## Known gaps

Error response cases (400, 401, 403, 404 for `/issue` and `/revoke`) are not yet covered.
They are blocked on the handlers implementing JWT claim validation.