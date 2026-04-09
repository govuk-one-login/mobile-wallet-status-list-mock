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
2. **Conformance testing** — both specs are used by Prism to enforce the OAS contract against the running service. 

For more information see [test/conformance/README.md](test/conformance/README.md)


