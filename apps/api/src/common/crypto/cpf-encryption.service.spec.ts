import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { CpfEncryptionService } from "./cpf-encryption.service";

function buildService(key?: string): CpfEncryptionService {
  const finalKey = key ?? randomBytes(32).toString("base64");
  const config = {
    get: (k: string) => (k === "CPF_ENCRYPTION_KEY" ? finalKey : undefined),
  } as unknown as ConfigService;
  return new CpfEncryptionService(config);
}

describe("CpfEncryptionService", () => {
  it("roundtrip encrypt/decrypt preserva o plaintext", () => {
    const svc = buildService();
    const cipher = svc.encrypt("12345678901");
    expect(cipher).not.toContain("12345678901");
    expect(svc.decrypt(cipher)).toBe("12345678901");
  });

  it("gera IV único a cada call — ciphertexts diferentes pro mesmo plain", () => {
    const svc = buildService();
    const a = svc.encrypt("12345678901");
    const b = svc.encrypt("12345678901");
    expect(a).not.toBe(b);
  });

  it("decrypt explode se auth tag adulterada", () => {
    const svc = buildService();
    const cipher = svc.encrypt("12345678901");
    const [iv, ct, tag] = cipher.split(":");
    const tampered = `${iv}:${ct}:${Buffer.from(tag, "base64").reverse().toString("base64")}`;
    expect(() => svc.decrypt(tampered)).toThrow();
  });

  it("decrypt explode se formato inválido", () => {
    const svc = buildService();
    expect(() => svc.decrypt("nope")).toThrow(/formato inválido/);
  });

  it("last2 retorna os 2 últimos dígitos", () => {
    const svc = buildService();
    expect(svc.last2("12345678901")).toBe("01");
  });

  it("constructor explode se CPF_ENCRYPTION_KEY ausente", () => {
    const config = { get: () => undefined } as unknown as ConfigService;
    expect(() => new CpfEncryptionService(config)).toThrow(/CPF_ENCRYPTION_KEY/);
  });

  it("constructor explode se key não decodifica para 32 bytes", () => {
    expect(() => buildService(Buffer.from("short").toString("base64"))).toThrow(/32 bytes/);
  });
});
