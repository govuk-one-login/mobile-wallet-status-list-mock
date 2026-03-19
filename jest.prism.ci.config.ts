// Jest config for Prism conformance tests that run against a deployed Lambda
// via API Gateway. Kept separate from jest.config.ts because these tests
// require UPSTREAM_URL to be set and a network-reachable environment.
//
// Run with: npm run test:prism:ci (UPSTREAM_URL must be set)
export default {
  preset: "ts-jest",
  testMatch: ["**/test/prism/**/*.prism.ci.test.ts"],
  testEnvironment: "node",
  testTimeout: 30000, // no cold start against deployed Lambda, 30s is sufficient
  clearMocks: true,
};
