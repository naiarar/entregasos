import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role, UserStatus, type AddressInput, type CreateTenant } from "@entregasos/shared";
import { Prisma } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { CpfEncryptionService } from "../../../common/crypto/cpf-encryption.service";
import { PrismaAdminService } from "../../../common/prisma/prisma-admin.service";

const INVITE_TTL_HOURS = 72;

const TENANT_PUBLIC_SELECT = {
  id: true,
  name: true,
  cnpj: true,
  legalName: true,
  responsibleName: true,
  cpfLast2: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TenantSelect;

export interface CreateTenantParams {
  input: CreateTenant;
  adminEmail: string;
  actorId: string;
}

export interface CreateTenantResult {
  tenant: {
    id: string;
    name: string;
    cnpj: string;
    legalName: string;
    responsibleName: string;
    responsibleCpf: string;
    cpfLast2: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    createdAt: Date;
  };
  invite: {
    url: string;
    expiresAt: Date;
  };
}

@Injectable()
export class AdminTenantsService {
  constructor(
    private readonly prismaAdmin: PrismaAdminService,
    private readonly cpfEncryption: CpfEncryptionService,
    private readonly config: ConfigService,
  ) {}

  async create(params: CreateTenantParams): Promise<CreateTenantResult> {
    const { input, adminEmail, actorId } = params;
    const normalizedEmail = adminEmail.toLowerCase().trim();
    const responsibleCpfEncrypted = this.cpfEncryption.encrypt(input.responsibleCpf);
    const cpfLast2 = this.cpfEncryption.last2(input.responsibleCpf);
    const inviteToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000);

    try {
      const tenant = await this.prismaAdmin.$transaction(async (tx) => {
        const address = await tx.address.create({ data: input.address as AddressInput });
        const created = await tx.tenant.create({
          data: {
            name: input.name,
            cnpj: input.cnpj,
            legalName: input.legalName,
            responsibleName: input.responsibleName,
            responsibleCpf: responsibleCpfEncrypted,
            cpfLast2,
            logoUrl: input.logoUrl ?? null,
            primaryColor: input.primaryColor ?? null,
            secondaryColor: input.secondaryColor ?? null,
            addressId: address.id,
          },
        });
        const adminUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            role: Role.ADMIN,
            status: UserStatus.PENDING_ACTIVATION,
            tenantId: created.id,
          },
        });
        await tx.invite.create({
          data: {
            tokenHash,
            tenantId: created.id,
            email: adminUser.email,
            role: Role.ADMIN,
            expiresAt,
            createdBy: actorId,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            actorRole: Role.GENERAL_ADMIN,
            targetTenantId: created.id,
            action: "TENANT_CREATE",
            payload: {
              tenantName: created.name,
              cnpj: created.cnpj,
              adminEmail: adminUser.email,
            },
          },
        });
        return created;
      });

      const baseUrl = this.config.get<string>("APP_BASE_URL") ?? "http://localhost:3000";
      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          cnpj: tenant.cnpj,
          legalName: tenant.legalName,
          responsibleName: tenant.responsibleName,
          responsibleCpf: tenant.responsibleCpf,
          cpfLast2: tenant.cpfLast2,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          createdAt: tenant.createdAt,
        },
        invite: {
          url: `${baseUrl}/activate?token=${inviteToken}`,
          expiresAt,
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "campo único";
        throw new ConflictException(`Já existe registro com ${target}`);
      }
      throw err;
    }
  }

  async list() {
    return this.prismaAdmin.tenant.findMany({
      orderBy: { createdAt: "desc" },
      select: TENANT_PUBLIC_SELECT,
    });
  }

  async getById(id: string) {
    const tenant = await this.prismaAdmin.tenant.findUnique({
      where: { id },
      select: { ...TENANT_PUBLIC_SELECT, address: true },
    });
    if (!tenant) {
      throw new NotFoundException("Tenant não encontrado");
    }
    return tenant;
  }
}
