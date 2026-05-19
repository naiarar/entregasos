import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3333);

  await app.listen(port);
  Logger.log(`EntregaSOS API rodando em http://localhost:${port}`, "Bootstrap");
}

bootstrap();
