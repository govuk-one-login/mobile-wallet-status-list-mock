export default {
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "results", outputName: "report.xml" }],
  ],
  collectCoverage: true,
  collectCoverageFrom: ["src/**", "test/conformance/helpers/**"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "src/types/",
    "src/common/types/",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: "ts-jest",
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/test/conformance/runners/"],
  testEnvironment: "node",
  clearMocks: true,
};
