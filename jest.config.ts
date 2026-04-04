export default {
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "results", outputName: "report.xml" }],
  ],
  collectCoverage: true,
  collectCoverageFrom: ["src/**"],
  coveragePathIgnorePatterns: [
    "/node-modules/",
    "src/types/",
    "src/common/types/",
    "test/conformance/",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: "ts-jest",
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/test/conformance/"],
  testEnvironment: "node",
  clearMocks: true,
};
