import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { diskStorage } from "multer";

const uploadRoot = resolve(process.env.UPLOAD_DIR ?? "./uploads");
mkdirSync(uploadRoot, { recursive: true });
const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg",
};

@Controller("assets")
export class AssetsController {
  @Post("upload")
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: uploadRoot,
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase() || imageExtensions[file.mimetype] || ".img"}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!imageExtensions[file.mimetype]) return callback(new BadRequestException("Upload a PNG, JPEG, WebP, GIF, or SVG image."), false);
      callback(null, true);
    },
  }))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Choose an image to upload.");
    const origin = process.env.PUBLIC_API_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
    return { name: file.originalname, mimeType: file.mimetype, size: file.size, url: `${origin}/uploads/${file.filename}` };
  }
}
