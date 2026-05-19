import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ClsModule } from "nestjs-cls";
import { AuthModule } from "./common/auth/auth.module";
import { CryptoModule } from "./common/crypto/crypto.module";
import { CpfMaskInterceptor } from "./common/interceptors/cpf-mask.interceptor";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthController } from "./health.controller";
import { AdminTenantsModule } from "./modules/admin/tenants/admin-tenants.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    CryptoModule,
    PrismaModule,
    AuthModule,
    AdminTenantsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: CpfMaskInterceptor }],
})
export class AppModule {}
