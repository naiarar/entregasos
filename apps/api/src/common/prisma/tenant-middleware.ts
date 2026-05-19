import type { Prisma } from "@prisma/client";
import type { ClsService } from "nestjs-cls";
import {
  TENANT_FILTERED_ACTIONS,
  TENANT_INJECT_ON_CREATE,
  TENANT_MODELS,
} from "./tenant-models";

export const CLS_TENANT_ID = "tenantId";
export const CLS_BYPASS_TENANT = "bypassTenant";

export type PrismaMiddleware = (
  params: Prisma.MiddlewareParams,
  next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
) => Promise<unknown>;

export class TenantContextMissingError extends Error {
  constructor(model: string, action: string) {
    super(
      `PrismaService: tenantId ausente no CLS para ${model}.${action}. ` +
        `Use PrismaAdminService para operações cross-tenant.`,
    );
    this.name = "TenantContextMissingError";
  }
}

export function createTenantPrismaMiddleware(cls: ClsService): PrismaMiddleware {
  return async (params, next) => {
    if (!params.model || !TENANT_MODELS.has(params.model)) {
      return next(params);
    }

    if (cls.isActive() && cls.get(CLS_BYPASS_TENANT) === true) {
      return next(params);
    }

    const tenantId = cls.isActive() ? cls.get<string | undefined>(CLS_TENANT_ID) : undefined;

    if (!tenantId) {
      throw new TenantContextMissingError(params.model, params.action);
    }

    if (TENANT_FILTERED_ACTIONS.has(params.action)) {
      params.args = params.args ?? {};
      params.args.where = { ...(params.args.where ?? {}), tenantId };
    } else if (TENANT_INJECT_ON_CREATE.has(params.action)) {
      params.args = params.args ?? {};
      if (params.action === "createMany") {
        const data = params.args.data;
        if (Array.isArray(data)) {
          params.args.data = data.map((row: Record<string, unknown>) => ({
            ...row,
            tenantId: row.tenantId ?? tenantId,
          }));
        }
      } else {
        params.args.data = {
          ...(params.args.data ?? {}),
          tenantId: params.args.data?.tenantId ?? tenantId,
        };
      }
    }

    return next(params);
  };
}
