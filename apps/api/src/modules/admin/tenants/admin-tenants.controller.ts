import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Role, createTenantSchema } from "@entregasos/shared";
import { z } from "zod";
import { CurrentUser } from "../../../common/auth/decorators/current-user.decorator";
import { Roles } from "../../../common/auth/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../../common/auth/types";
import { AdminTenantsService } from "./admin-tenants.service";

const createBodySchema = createTenantSchema.extend({
  adminEmail: z.string().email(),
});

@Controller("admin/tenants")
@Roles(Role.GENERAL_ADMIN)
export class AdminTenantsController {
  constructor(private readonly service: AdminTenantsService) {}

  @Post()
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const parsed = createBodySchema.parse(body);
    const { adminEmail, ...input } = parsed;
    return this.service.create({ input, adminEmail, actorId: user.userId });
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.service.getById(id);
  }
}
