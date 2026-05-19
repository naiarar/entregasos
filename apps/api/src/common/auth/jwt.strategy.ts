import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";
import { ExtractJwt, Strategy } from "passport-jwt";
import { CLS_TENANT_ID } from "../prisma/prisma.service";
import type { AuthenticatedUser, JwtPayload } from "./types";

export const CLS_USER = "user";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly cls: ClsService,
  ) {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET ausente em env");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub || !payload?.role) {
      throw new UnauthorizedException("Token inválido");
    }

    const user: AuthenticatedUser = {
      userId: payload.sub,
      tenantId: payload.tenantId ?? null,
      role: payload.role,
      driverId: payload.driverId,
    };

    if (this.cls.isActive()) {
      this.cls.set(CLS_USER, user);
      if (user.tenantId) {
        this.cls.set(CLS_TENANT_ID, user.tenantId);
      }
    }

    return user;
  }
}
