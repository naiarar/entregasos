import type { Role } from "@entregasos/shared";

export interface JwtPayload {
  sub: string;
  tenantId: string | null;
  role: Role;
  driverId?: string;
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string | null;
  role: Role;
  driverId?: string;
}
