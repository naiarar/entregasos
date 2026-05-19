import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { CpfMaskInterceptor } from "./cpf-mask.interceptor";

function run(payload: unknown): Promise<unknown> {
  const interceptor = new CpfMaskInterceptor();
  const ctx = {} as ExecutionContext;
  const next: CallHandler = { handle: () => of(payload) };
  return lastValueFrom(interceptor.intercept(ctx, next));
}

describe("CpfMaskInterceptor", () => {
  it("mascara responsibleCpf usando cpfLast2 do mesmo nível", async () => {
    const result = await run({ id: "1", responsibleCpf: "encblob", cpfLast2: "67" });
    expect(result).toEqual({ id: "1", responsibleCpf: "***.***.***-67", cpfLast2: "67" });
  });

  it("mascara com ** quando cpfLast2 ausente", async () => {
    const result = await run({ responsibleCpf: "12345678901" });
    expect(result).toEqual({ responsibleCpf: "***.***.***-**" });
  });

  it("ignora cpfLast2 inválido", async () => {
    const result = await run({ responsibleCpf: "x", cpfLast2: "abc" });
    expect(result).toEqual({ responsibleCpf: "***.***.***-**", cpfLast2: "abc" });
  });

  it("mascara em arrays de objetos", async () => {
    const result = await run([
      { responsibleCpf: "a", cpfLast2: "10" },
      { responsibleCpf: "b", cpfLast2: "22" },
    ]);
    expect(result).toEqual([
      { responsibleCpf: "***.***.***-10", cpfLast2: "10" },
      { responsibleCpf: "***.***.***-22", cpfLast2: "22" },
    ]);
  });

  it("mascara em objetos aninhados, usando o cpfLast2 do mesmo nível do cpf", async () => {
    const result = await run({
      total: 1,
      tenants: [{ name: "X", responsibleCpf: "ct", cpfLast2: "99" }],
    });
    expect(result).toEqual({
      total: 1,
      tenants: [{ name: "X", responsibleCpf: "***.***.***-99", cpfLast2: "99" }],
    });
  });

  it("também mascara o campo genérico 'cpf'", async () => {
    const result = await run({ cpf: "12345678901", cpfLast2: "01" });
    expect(result).toEqual({ cpf: "***.***.***-01", cpfLast2: "01" });
  });

  it("preserva campos não-cpf intactos", async () => {
    const result = await run({ id: "1", name: "Padaria", cnpj: "12345678000100" });
    expect(result).toEqual({ id: "1", name: "Padaria", cnpj: "12345678000100" });
  });

  it("retorna primitivos e null sem mexer", async () => {
    expect(await run(null)).toBe(null);
    expect(await run("string")).toBe("string");
    expect(await run(42)).toBe(42);
  });

  it("preserva Date", async () => {
    const date = new Date("2026-05-19T00:00:00Z");
    const result = (await run({ createdAt: date })) as { createdAt: Date };
    expect(result.createdAt).toBe(date);
  });
});
