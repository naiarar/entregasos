import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class CpfEncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>("CPF_ENCRYPTION_KEY");
    if (!raw) {
      throw new Error("CPF_ENCRYPTION_KEY ausente em env");
    }
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) {
      throw new Error("CPF_ENCRYPTION_KEY deve decodificar para 32 bytes (base64)");
    }
    this.key = buf;
  }

  encrypt(plain: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString("base64"), ciphertext.toString("base64"), authTag.toString("base64")].join(":");
  }

  decrypt(encoded: string): string {
    const [ivB64, ctB64, tagB64] = encoded.split(":");
    if (!ivB64 || !ctB64 || !tagB64) {
      throw new Error("CPF criptografado em formato inválido");
    }
    const iv = Buffer.from(ivB64, "base64");
    const ciphertext = Buffer.from(ctB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error("Auth tag inválida");
    }
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }

  last2(plain: string): string {
    if (plain.length < 2) {
      throw new Error("CPF muito curto para extrair últimos 2 dígitos");
    }
    return plain.slice(-2);
  }
}
