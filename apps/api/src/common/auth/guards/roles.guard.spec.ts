import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@entregasos/shared";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../types";
import { RolesGuard } from "./roles.guard";

function buildContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("libera quando o handler não define @Roles", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const user: AuthenticatedUser = {
      userId: "u1",
      tenantId: "t1",
      role: Role.DRIVER,
    };
    expect(guard.canActivate(buildContext(user))).toBe(true);
  });

  it("libera quando @Roles inclui a role do usuário", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) =>
      key === ROLES_KEY ? [Role.ADMIN, Role.DISPATCHER] : undefined,
    );
    const user: AuthenticatedUser = {
      userId: "u1",
      tenantId: "t1",
      role: Role.ADMIN,
    };
    expect(guard.canActivate(buildContext(user))).toBe(true);
  });

  it("nega com 403 quando role não está em @Roles", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) =>
      key === ROLES_KEY ? [Role.GENERAL_ADMIN] : undefined,
    );
    const user: AuthenticatedUser = {
      userId: "u1",
      tenantId: "t1",
      role: Role.ADMIN,
    };
    expect(() => guard.canActivate(buildContext(user))).toThrow(ForbiddenException);
  });

  it("nega quando não há usuário no request", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) =>
      key === ROLES_KEY ? [Role.ADMIN] : undefined,
    );
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });
});
