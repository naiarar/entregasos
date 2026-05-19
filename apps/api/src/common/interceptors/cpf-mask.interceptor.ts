import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

const CPF_FIELD_NAMES = new Set(["responsibleCpf", "cpf"]);

function maskCpf(last2?: string | null): string {
  const tail = last2 && /^\d{2}$/.test(last2) ? last2 : "**";
  return `***.***.***-${tail}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  if (Buffer.isBuffer(value)) return false;
  return true;
}

function maskRecursively(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(maskRecursively);
  }
  if (!isPlainObject(node)) {
    return node;
  }

  const last2 = typeof node.cpfLast2 === "string" ? node.cpfLast2 : undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (CPF_FIELD_NAMES.has(key) && typeof value === "string") {
      out[key] = maskCpf(last2);
    } else {
      out[key] = maskRecursively(value);
    }
  }
  return out;
}

@Injectable()
export class CpfMaskInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(maskRecursively));
  }
}
