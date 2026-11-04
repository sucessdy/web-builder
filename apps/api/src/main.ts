import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",").map((origin) => origin.trim()) ?? "http://localhost:5173",
    allowedHeaders: ["Content-Type", "X-Workspace-Id"],
  });
  app.setGlobalPrefix("api");
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
