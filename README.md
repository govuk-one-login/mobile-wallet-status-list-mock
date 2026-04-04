# Mobile Wallet Status List Mock

## Overview

This is a mock implementation of the Status List service used by GOV.UK Wallet to check the current status of its stored credentials. It is designed for integration with the Example Credential Issuer (CRI) and GOV.UK Wallet in development and build environments only.

This project uses AWS SAM to define and deploy the following AWS resources:

- API Gateway (regional REST API): Provides endpoints for credential status management and public access to status lists and JSON Web Key Sets (JWKS)
- AWS Lambda functions: Handle status issuance, revocation, and JWKS publishing
- Amazon S3 buckets: Store status lists and JWKS
- AWS KMS key (asymmetric): Used for cryptographically signing status list tokens

## Pre-requisites

- [Node.js](https://nodejs.org/en) version 22 or higher (use the provided `.nvmrc` file with [nvm](https://github.com/nvm-sh/nvm) for easy version management)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) for deployment
- a tool for running docker applications locally, like [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Quickstart

### Install dependencies

```
npm install
```

### Test

#### Unit Tests

Run unit tests to test the functionality of individual functions:

```
npm run test
```

### Build

Build the SAM template:

```
npm run build
```

### Run Locally

Copy `.env.json.example` to `.env.json`. This is your local environment configuration file.

*N.B.* Ensure Docker daemon is running first.

```
npm run dev
```

This command will:
- Start LocalStack.
- Invoke the JwksFunction Lambda function.
- Run the JwksFunction, InvokeFunction and RevokeFunction Lambda functions locally to test through a local HTTP server host.

The status list mock will be available at http://localhost:3000.


#### Accessing S3 Resources Locally

The `/t/{id}` and `/.well-known/jwks.json` endpoints use API Gateway S3 proxy integrations. Due to a limitation in `sam local start-api`, these endpoints will not work when running locally.

To retrieve these resources locally, use the AWS CLI with the LocalStack endpoint:

```bash
# Get JWKS
aws --endpoint-url=http://localhost:4562 s3 cp s3://jwks/.well-known/jwks.json -

# Get status list token
aws --endpoint-url=http://localhost:4562 s3 cp s3://status-list/t/{id} -

Replace `{id}` with the actual token ID (e.g., `81d8809a-79c3-45b3-9fa1-4108c49f240c`).
```

## OpenAPI Specifications

This repo contains the following OpenAPI specs under `openApiSpec/`:

- `openApiSpec/mock/api-spec.yaml` — the deployed API Gateway spec for this mock service
- `openApiSpec/crs/crs-private-spec.yaml` — a copy of the CRS private API spec (`/issue`, `/revoke`)
- `openApiSpec/crs/crs-public-spec.yaml` — a copy of the CRS public API spec (`/t/{id}`)

### Why are the CRS specs in this repo?

This mock implements the same API contract as the real CRS service. To ensure the mock
does not drift from the real service, copies of the CRS specs are kept here and used in
two ways:

1. **Drift detection** — the private spec is checked against the upstream source daily and on every PR
2. **Conformance testing** — both specs are used by Prism to enforce the OAS contract against the running service

### OAS Drift Detection

The `check-oas-for-drift` workflow clones the `crs-backend` repo and uses [oasdiff](https://github.com/oasdiff/oasdiff)
to diff its spec against the copy in this repo. Any difference will fail the workflow. When the workflow fails, a
notification is sent to the OP Slack channel and engineers should action the diff as a priority by updating
`openApiSpec/crs/crs-private-spec.yaml` to reflect the upstream changes.

---

## Conformance Tests

Prism proxy-mode tests that verify the deployed service matches its OAS contract. They
cover `POST /issue`, `POST /revoke`, and `GET /t/{id}` against both the private and
public CRS specs. See [test/conformance/README.md](test/conformance/README.md) for
full details on how they work, the test suites, and how to run them.

### How conformance and drift detection work together

Drift detection ensures the spec copies in this repo stay in sync with the upstream CRS
spec. Conformance tests ensure the deployed service honours those specs. If the real CRS
contract changes, drift detection catches it. If a code or infrastructure change breaks
the mock's behaviour, conformance tests catch it.

### When the conformance tests fail

A Slack alert is sent to the OP channel on failure. The cause will be one of:

- **422 from Prism** — request violated the OAS spec (wrong or missing Content-Type). Check the test or spec.
- **Unexpected status code** — service returned an error (e.g. 500 instead of 200). Check the service or infrastructure.
- **Response schema mismatch** — service response does not match the OAS schema. Compare the response against `crs-private-spec.yaml` or `crs-public-spec.yaml`.
- **Prism failed to start** — upstream unreachable. Verify the deployment completed and `UPSTREAM_URL` is correct.

If `check-oas-for-drift` has also failed, update the spec copy first — the two failures are likely related.
