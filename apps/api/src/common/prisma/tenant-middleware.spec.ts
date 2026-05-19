import type { Prisma } from "@prisma/client";
import type { ClsService } from "nestjs-cls";
import {
  CLS_BYPASS_TENANT,
  CLS_TENANT_ID,
  TenantContextMissingError,
  createTenantPrismaMiddleware,
} from "./tenant-middleware";

function buildCls(store: Record<string, unknown>): ClsService {
  return {
    isActive: () => true,
    get: (key: string) => store[key],
  } as unknown as ClsService;
}

function buildInactiveCls(): ClsService {
  return {
    isActive: () => false,
    get: () => undefined,
  } as unknown as ClsService;
}

describe("createTenantPrismaMiddleware", () => {
  it("injeta where: { tenantId } em findMany de modelo tenant-scoped", async () => {
    const cls = buildCls({ [CLS_TENANT_ID]: "tenant-a" });
    const middleware = createTenantPrismaMiddleware(cls);
    const params = {
      model: "Driver",
      action: "findMany",
      args: { where: { active: true } },
      dataPath: [],
      runInTransaction: false,
    } as unknown as Prisma.MiddlewareParams;

    const next = jest.fn().mockResolvedValue([]);
    await middleware(params, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(params.args.where).toEqual({ active: true, tenantId: "tenant-a" });
  });

  it("não permite override manual do tenantId via where", async () => {
    const cls = buildCls({ [CLS_TENANT_ID]: "tenant-a" });
    const middleware = createTenantPrismaMiddleware(cls);
    const params = {
      model: "Driver",
      action: "findMany",
      args: { where: { tenantId: "tenant-b" } },
      dataPath: [],
      runInTransaction: false,
    } as unknown as Prisma.MiddlewareParams;

    await middleware(params, jest.fn().mockResolvedValue([]));

    expect(params.args.where.tenantId).toBe("tenant-a");
  });

  it("injeta tenantId em data quando create", async () => {
    const cls = buildCls({ [CLS_TENANT_ID]: "tenant-a" });
    const middleware = createTenantPrismaMiddleware(cls);
    const params = {
      model: "Driver",
      action: "create",
      args: { data: { userId: "u1", vehicleType: "BIKE", vehicleOwnership: "OWN" } },
      dataPath: [],
      runInTransaction: false,
    } as unknown as Prisma.MiddlewareParams;

    await middleware(params, jest.fn().mockResolvedValue({}));

    expect(params.args.data.tenantId).toBe("tenant-a");
  });

  it("ignora modelos não tenant-scoped (Tenant, User, Address, AuditLog)", async () => {
    const cls = buildCls({ [CLS_TENANT_ID]: "tenant-a" });
    const middleware = createTenantPrismaMiddleware(cls);

    for (const model of ["Tenant", "User", "Address", "AuditLog"]) {
      const params = {
        model,
        action: "findMany",
        args: { where: { id: "x" } },
        dataPath: [],
        runInTransaction: false,
      } as unknown as Prisma.MiddlewareParams;

      await middleware(params, jest.fn().mockResolvedValue([]));
      expect(params.args.where).toEqual({ id: "x" });
    }
  });

  it("explode quando modelo tenant-scoped sem tenantId no CLS", async () => {
    const cls = buildInactiveCls();
    const middleware = createTenantPrismaMiddleware(cls);
    const params = {
      model: "Driver",
      action: "findMany",
      args: {},
      dataPath: [],
      runInTransaction: false,
    } as unknown as Prisma.MiddlewareParams;

    await expect(middleware(params, jest.fn())).rejects.toBeInstanceOf(TenantContextMissingError);
  });

  it("bypass quando CLS_BYPASS_TENANT está set (uso admin via PrismaService — raro)", async () => {
    const cls = buildCls({ [CLS_BYPASS_TENANT]: true });
    const middleware = createTenantPrismaMiddleware(cls);
    const params = {
      model: "Driver",
      action: "findMany",
      args: { where: { active: true } },
      dataPath: [],
      runInTransaction: false,
    } as unknown as Prisma.MiddlewareParams;

    const next = jest.fn().mockResolvedValue([]);
    await middleware(params, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(params.args.where).toEqual({ active: true });
  });

  it("filtra Invite também (segundo modelo tenant-scoped)", async () => {
    const cls = buildCls({ [CLS_TENANT_ID]: "tenant-a" });
    const middleware = createTenantPrismaMiddleware(cls);
    const params = {
      model: "Invite",
      action: "findFirst",
      args: { where: { email: "x@y.com" } },
      dataPath: [],
      runInTransaction: false,
    } as unknown as Prisma.MiddlewareParams;

    await middleware(params, jest.fn().mockResolvedValue(null));

    expect(params.args.where).toEqual({ email: "x@y.com", tenantId: "tenant-a" });
  });
});
