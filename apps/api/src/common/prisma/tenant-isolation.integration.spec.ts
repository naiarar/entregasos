import { Test } from "@nestjs/testing";
import { Role, VehicleOwnership, VehicleType } from "@entregasos/shared";
import { ClsModule, ClsService } from "nestjs-cls";
import { randomUUID } from "node:crypto";
import { PrismaAdminService } from "./prisma-admin.service";
import { PrismaService } from "./prisma.service";
import { CLS_TENANT_ID, TenantContextMissingError } from "./tenant-middleware";

describe("tenant isolation (integration)", () => {
  let prisma: PrismaService;
  let prismaAdmin: PrismaAdminService;
  let cls: ClsService;

  let tenantA: { id: string };
  let tenantB: { id: string };
  let driverA: { id: string };
  let driverB: { id: string };
  let runId: string;

  beforeAll(async () => {
    runId = randomUUID().slice(0, 8);

    const moduleRef = await Test.createTestingModule({
      imports: [ClsModule.forRoot({ global: true })],
      providers: [PrismaService, PrismaAdminService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    prismaAdmin = moduleRef.get(PrismaAdminService);
    cls = moduleRef.get(ClsService);
    await prisma.$connect();
    await prismaAdmin.$connect();

    const addressA = await prismaAdmin.address.create({
      data: {
        street: "Rua A",
        number: "1",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01001000",
      },
    });
    const addressB = await prismaAdmin.address.create({
      data: {
        street: "Rua B",
        number: "2",
        neighborhood: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "20040020",
      },
    });

    tenantA = await prismaAdmin.tenant.create({
      data: {
        name: `Tenant A ${runId}`,
        cnpj: `00.${runId}.000/0001-00`.slice(0, 18),
        legalName: "A LTDA",
        responsibleName: "Resp A",
        responsibleCpf: "cipher-a",
        cpfLast2: "11",
        addressId: addressA.id,
      },
    });
    tenantB = await prismaAdmin.tenant.create({
      data: {
        name: `Tenant B ${runId}`,
        cnpj: `01.${runId}.000/0001-00`.slice(0, 18),
        legalName: "B LTDA",
        responsibleName: "Resp B",
        responsibleCpf: "cipher-b",
        cpfLast2: "22",
        addressId: addressB.id,
      },
    });

    const userA = await prismaAdmin.user.create({
      data: {
        email: `driver-a-${runId}@x.com`,
        role: Role.DRIVER,
        tenantId: tenantA.id,
      },
    });
    const userB = await prismaAdmin.user.create({
      data: {
        email: `driver-b-${runId}@x.com`,
        role: Role.DRIVER,
        tenantId: tenantB.id,
      },
    });

    driverA = await prismaAdmin.driver.create({
      data: {
        tenantId: tenantA.id,
        userId: userA.id,
        vehicleType: VehicleType.MOTO,
        vehicleOwnership: VehicleOwnership.OWN,
      },
    });
    driverB = await prismaAdmin.driver.create({
      data: {
        tenantId: tenantB.id,
        userId: userB.id,
        vehicleType: VehicleType.BIKE,
        vehicleOwnership: VehicleOwnership.OWN,
      },
    });
  }, 30000);

  afterAll(async () => {
    if (driverA?.id) await prismaAdmin.driver.deleteMany({ where: { id: { in: [driverA.id, driverB.id] } } });
    if (tenantA?.id) {
      await prismaAdmin.user.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
      const addressIds = [tenantA, tenantB]
        .map((t) => t && (t as { addressId?: string }).addressId)
        .filter(Boolean) as string[];
      await prismaAdmin.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
      if (addressIds.length) {
        await prismaAdmin.address.deleteMany({ where: { id: { in: addressIds } } });
      }
    }
    await prisma.$disconnect();
    await prismaAdmin.$disconnect();
  });

  it("findMany retorna só drivers do tenant ativo no CLS", async () => {
    const resultA = await cls.runWith({ [CLS_TENANT_ID]: tenantA.id } as never, async () => {
      return prisma.driver.findMany({});
    });
    const resultB = await cls.runWith({ [CLS_TENANT_ID]: tenantB.id } as never, async () => {
      return prisma.driver.findMany({});
    });

    expect(resultA.map((d) => d.id)).toEqual([driverA.id]);
    expect(resultB.map((d) => d.id)).toEqual([driverB.id]);
  });

  it("findUnique cross-tenant retorna null (404 path — não vaza existência)", async () => {
    const result = await cls.runWith({ [CLS_TENANT_ID]: tenantA.id } as never, async () => {
      return prisma.driver.findFirst({ where: { id: driverB.id } });
    });
    expect(result).toBeNull();
  });

  it("updateMany cross-tenant não afeta linhas", async () => {
    const result = await cls.runWith({ [CLS_TENANT_ID]: tenantA.id } as never, async () => {
      return prisma.driver.updateMany({
        where: { id: driverB.id },
        data: { active: false },
      });
    });
    expect(result.count).toBe(0);

    const stillActive = await prismaAdmin.driver.findUnique({ where: { id: driverB.id } });
    expect(stillActive?.active).toBe(true);
  });

  it("query em modelo tenant-scoped sem CLS_TENANT_ID explode (falha rápida)", async () => {
    await expect(prisma.driver.findMany({})).rejects.toBeInstanceOf(TenantContextMissingError);
  });

  it("PrismaAdminService enxerga todos os drivers (uso GENERAL_ADMIN)", async () => {
    const all = await prismaAdmin.driver.findMany({
      where: { id: { in: [driverA.id, driverB.id] } },
      orderBy: { createdAt: "asc" },
    });
    expect(all.map((d) => d.id).sort()).toEqual([driverA.id, driverB.id].sort());
  });
});
