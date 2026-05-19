import type { Config } from "jest";

const config: Config = {
  rootDir: ".",
  testEnvironment: "node",
  preset: "ts-jest",
  testRegex: ".*\\.spec\\.ts$",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^@entregasos/shared$": "<rootDir>/../../packages/shared/src",
    "^@entregasos/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.module.ts", "!src/main.ts"],
  coverageDirectory: "coverage",
  projects: [
    {
      displayName: "unit",
      testRegex: ".*\\.spec\\.ts$",
      testPathIgnorePatterns: ["/node_modules/", "/dist/", "\\.integration\\.spec\\.ts$"],
      preset: "ts-jest",
      testEnvironment: "node",
      moduleFileExtensions: ["js", "json", "ts"],
      moduleNameMapper: {
        "^@entregasos/shared$": "<rootDir>/../../packages/shared/src",
        "^@entregasos/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
      },
      transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
      },
    },
    {
      displayName: "integration",
      testRegex: ".*\\.integration\\.spec\\.ts$",
      testPathIgnorePatterns: ["/node_modules/", "/dist/"],
      preset: "ts-jest",
      testEnvironment: "node",
      moduleFileExtensions: ["js", "json", "ts"],
      moduleNameMapper: {
        "^@entregasos/shared$": "<rootDir>/../../packages/shared/src",
        "^@entregasos/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
      },
      transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
      },
      setupFilesAfterEnv: ["<rootDir>/test/setup-integration.ts"],
    },
  ],
};

export default config;
