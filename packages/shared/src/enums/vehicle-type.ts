export const VehicleType = {
  BIKE: "BIKE",
  MOTO: "MOTO",
  CAR: "CAR",
} as const;

export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];
