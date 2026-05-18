export const UserStatus = {
  PENDING_ACTIVATION: "PENDING_ACTIVATION",
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
