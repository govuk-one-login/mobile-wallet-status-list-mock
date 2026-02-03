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
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: "ts-jest",
  testMatch: ["**/*.test.ts"],
  testEnvironment: "node",
  clearMocks: true,
};
