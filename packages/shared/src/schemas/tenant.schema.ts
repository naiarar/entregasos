import { z } from "zod";
import { addressSchema } from "./address.schema";

const hexColor = z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser hex #RRGGBB");

const onlyDigits = (input: string) => input.replace(/\D/g, "");

const cnpjSchema = z
  .string()
  .transform(onlyDigits)
  .pipe(z.string().length(14, "CNPJ deve ter 14 dígitos"));

const cpfSchema = z
  .string()
  .transform(onlyDigits)
  .pipe(z.string().length(11, "CPF deve ter 11 dígitos"));

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  cnpj: cnpjSchema,
  legalName: z.string().min(2).max(200),
  responsibleName: z.string().min(3).max(120),
  responsibleCpf: cpfSchema,
  address: addressSchema,
  logoUrl: z.string().url().optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
});

export type CreateTenantInput = z.input<typeof createTenantSchema>;
export type CreateTenant = z.output<typeof createTenantSchema>;

export const updateTenantBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
});

export type UpdateTenantBranding = z.infer<typeof updateTenantBrandingSchema>;
