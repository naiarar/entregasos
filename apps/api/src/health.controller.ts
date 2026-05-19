import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/auth/decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: "ok",
      service: "entregasos-api",
      timestamp: new Date().toISOString(),
    };
  }
}
