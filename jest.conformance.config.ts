export default {
  preset: "ts-jest",
  testMatch: ["**/test/conformance/**/*.prism.*.test.ts"], // matches both local and ci conformance tests
  testEnvironment: "node",
  testTimeout: 60000, // 60s to accommodate Lambda cold start
  maxWorkers: 1, // suites share port 4010 — run serially to avoid conflicts
  clearMocks: true,
};
