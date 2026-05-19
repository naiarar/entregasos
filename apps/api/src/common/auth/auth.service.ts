import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@entregasos/shared";
import * as bcrypt from "bcrypt";
import { PrismaAdminService } from "../prisma/prisma-admin.service";
import type { JwtPayload } from "./types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaAdmin: PrismaAdminService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.prismaAdmin.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: { driver: { select: { id: true } } },
    });

    if (!user || !user.passwordHash || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      driverId: user.driver?.id,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
