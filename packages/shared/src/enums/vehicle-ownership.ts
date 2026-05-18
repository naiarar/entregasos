export const VehicleOwnership = {
  OWN: "OWN",
  RENTED: "RENTED",
  COMPANY: "COMPANY",
} as const;

export type VehicleOwnership = (typeof VehicleOwnership)[keyof typeof VehicleOwnership];
