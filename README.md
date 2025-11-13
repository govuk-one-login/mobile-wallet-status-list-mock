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