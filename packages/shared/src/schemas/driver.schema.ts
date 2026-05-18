import { z } from "zod";
import { VehicleType } from "../enums/vehicle-type";
import { VehicleOwnership } from "../enums/vehicle-ownership";

export const createDriverSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(11)),
  vehicleType: z.nativeEnum(VehicleType),
  vehicleOwnership: z.nativeEnum(VehicleOwnership),
});

export type CreateDriverInput = z.input<typeof createDriverSchema>;
export type CreateDriver = z.output<typeof createDriverSchema>;
