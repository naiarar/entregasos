import { Global, Module } from "@nestjs/common";
import { CpfEncryptionService } from "./cpf-encryption.service";

@Global()
@Module({
  providers: [CpfEncryptionService],
  exports: [CpfEncryptionService],
})
export class CryptoModule {}
