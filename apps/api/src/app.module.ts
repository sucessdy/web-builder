import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { AiController } from "./ai.controller.js";
import { AssetsController } from "./assets.controller.js";
import { PagesController } from "./pages.controller.js";

const uploadRoot = resolve(process.env.UPLOAD_DIR ?? "./uploads");
mkdirSync(uploadRoot, { recursive: true });

@Module({
  imports: [ServeStaticModule.forRoot({ rootPath: uploadRoot, serveRoot: "/uploads" })],
  controllers: [PagesController, AssetsController, AiController],
})
export class AppModule {}
