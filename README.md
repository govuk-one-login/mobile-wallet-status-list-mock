# mobile-wallet-status-list-mock

## Overview

A service that allows credential issuer to communicate the current status of issued credentials (active, revoked, etc.) to wallet and verifier.

## Pre-requisites

- [Node.js](https://nodejs.org/en/) (>= 20.11.1)
- [NPM](https://www.npmjs.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Homebrew](https://brew.sh)

We recommend using [nvm](https://github.com/nvm-sh/nvm) to install and manage Node.js versions.

To install nvm, run:
```
brew install nvm
```

Then, to install and use the required version of node using nvm, run the following commands:
```
nvm install
```

```
nvm use
```

## Quickstart

### Install

Install the dependencies with:
```
npm install
```

### Lint & Format

Lint and format the code with:
```
npm run lint
```

```
npm run format
```

### Build

Build the assets with:
```
npm run build
```

### Test

Unit test the code with:
```
npm run test
```
