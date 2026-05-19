import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ClsService } from "nestjs-cls";
import { createTenantPrismaMiddleware } from "./tenant-middleware";

export { CLS_TENANT_ID, CLS_BYPASS_TENANT } from "./tenant-middleware";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(cls: ClsService) {
    super();
    this.$use(createTenantPrismaMiddleware(cls));
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
