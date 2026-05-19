import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClsModule } from "nestjs-cls";
import { AuthModule } from "./common/auth/auth.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
