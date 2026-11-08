import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import { checkOrigin, fail, HttpError } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const length = Number(req.headers.get("content-length"));
    if (length > 11 * 1024 * 1024)
      throw new HttpError(413, "A foto deve ter até 10 MB.");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      throw new HttpError(400, "Escolha uma foto.");
    if (file.size > 10 * 1024 * 1024)
      throw new HttpError(413, "A foto deve ter até 10 MB.");
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    )
      throw new HttpError(400, "Use JPG, PNG, WebP ou GIF.");
    let data: Buffer;
    try {
      data = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize({
          width: 1400,
          height: 1400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new HttpError(
        400,
        "Essa imagem não pôde ser lida. Escolha outra foto.",
      );
    }
    const id = randomUUID();
    await pool.query(
      "INSERT INTO images (id,data,mime_type) VALUES ($1,$2,$3)",
      [id, data, "image/webp"],
    );
    return Response.json({ url: `/api/images/${id}` }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
