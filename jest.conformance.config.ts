// Jest config for local Prism conformance tests that run against real Lambda
// handlers via SAM local. Need this Separate from jest.config.ts for two reasons:
//
// 1. These tests require the local stack (LocalStack + SAM local) to be running
//    before Jest starts. Running them as part of `npm test` would cause failures
//    for any developer who hasn't started the stack.
//
// 2. SAM local incurs a Lambda cold start on the first invocation, so these
//    tests need a much longer timeout than unit tests. 60s covers cold start
//    (~10s), Prism startup, and the requests themselves.
//
// Run with: npm run test:prism:local (after `npm run dev`)
export default {
  preset: "ts-jest",
  testMatch: ["**/test/conformance/**/*.prism.local.test.ts"], // only matches local conformance tests, not unit tests
  testEnvironment: "node",
  testTimeout: 60000, // 60s to accommodate Lambda cold start
  maxWorkers: 1, // suites share port 4010 — run serially to avoid conflicts
  clearMocks: true,
};