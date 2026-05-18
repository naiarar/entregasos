import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(),
  zipCode: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(8)),
});

export type AddressInput = z.input<typeof addressSchema>;
export type Address = z.output<typeof addressSchema>;
