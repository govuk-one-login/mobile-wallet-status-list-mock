export default {
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "results", outputName: "report.xml" }],
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node-modules/"],
  preset: "ts-jest",
  testMatch: ["**/*.test.ts"],
  testEnvironment: "node",
  clearMocks: true,
};
