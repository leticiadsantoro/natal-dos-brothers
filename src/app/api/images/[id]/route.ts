import { pool } from "@/lib/db";
import { uuid } from "@/lib/validation";
import { fail } from "@/lib/http";
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = uuid.safeParse((await ctx.params).id);
    if (!parsed.success) return new Response(null, { status: 404 });
    const { rows } = await pool.query(
      "SELECT data,mime_type FROM images WHERE id=$1",
      [parsed.data],
    );
    if (!rows[0]) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(rows[0].data), {
      headers: {
        "Content-Type": rows[0].mime_type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
