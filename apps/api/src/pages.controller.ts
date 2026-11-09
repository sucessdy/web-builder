import { Body, Controller, Delete, Get, Headers, NotFoundException, Param, Put } from "@nestjs/common";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type PageRecord = { workspaceId: string; id: string; name: string; document: unknown; updatedAt: string };
const dataRoot = resolve(process.env.DATA_DIR ?? "./data");
const pagesFile = resolve(dataRoot, "pages.json");

async function readPages(): Promise<PageRecord[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(pagesFile, "utf8"));
    return Array.isArray(parsed) ? parsed as PageRecord[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writePages(pages: PageRecord[]) {
  await mkdir(dataRoot, { recursive: true });
  await writeFile(pagesFile, JSON.stringify(pages, null, 2), "utf8");
}

@Controller("pages")
export class PagesController {
  @Get()
  async list(@Headers("x-workspace-id") workspaceId?: string) {
    return (await readPages()).filter((page) => page.workspaceId === (workspaceId || "local"));
  }

  @Put(":id")
  async save(@Param("id") id: string, @Headers("x-workspace-id") workspaceId: string | undefined, @Body() body: { name?: string; document?: unknown }) {
    const pages = await readPages();
    const owner = workspaceId || "local";
    const current = pages.find((page) => page.id === id && page.workspaceId === owner);
    const page: PageRecord = {
      workspaceId: owner,
      id,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : current?.name ?? "Untitled page",
      document: body.document,
      updatedAt: new Date().toISOString(),
    };
    await writePages([...pages.filter((item) => item.id !== id || item.workspaceId !== owner), page]);
    return page;
  }

  @Get(":id")
  async get(@Param("id") id: string, @Headers("x-workspace-id") workspaceId?: string) {
    const page = (await readPages()).find((item) => item.id === id && item.workspaceId === (workspaceId || "local"));
    if (!page) throw new NotFoundException("Page not found.");
    return page;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Headers("x-workspace-id") workspaceId?: string) {
    const owner = workspaceId || "local";
    const pages = await readPages();
    const remaining = pages.filter((page) => page.id !== id || page.workspaceId !== owner);
    if (remaining.length === pages.length) throw new NotFoundException("Page not found.");
    await writePages(remaining);
    return { deleted: true };
  }
}
