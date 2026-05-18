export const Role = {
  GENERAL_ADMIN: "GENERAL_ADMIN",
  ADMIN: "ADMIN",
  DISPATCHER: "DISPATCHER",
  DRIVER: "DRIVER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
