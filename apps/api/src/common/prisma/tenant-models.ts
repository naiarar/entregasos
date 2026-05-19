export const TENANT_MODELS = new Set<string>(["Driver", "Invite"]);

export const TENANT_FILTERED_ACTIONS = new Set<string>([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

export const TENANT_INJECT_ON_CREATE = new Set<string>(["create", "createMany"]);
