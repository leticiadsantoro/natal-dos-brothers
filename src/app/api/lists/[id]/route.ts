import { pool } from "@/lib/db";
import { body, checkOrigin, fail, HttpError } from "@/lib/http";
import { uuid, listInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, ctx: Context) {
  try {
    const id = uuid.parse((await ctx.params).id);
    const { rows } = await pool.query("SELECT * FROM lists WHERE id=$1", [id]);
    if (!rows[0]) throw new HttpError(404, "Lista não encontrada.");
    const gifts = await pool.query(
      "SELECT * FROM gifts WHERE list_id=$1 ORDER BY created_at,id",
      [id],
    );
    return Response.json({ ...rows[0], gifts: gifts.rows });
  } catch (e) {
    return fail(e);
  }
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    const id = uuid.parse((await ctx.params).id);
    const data = listInput.parse(await body(req));
    const { rows } = await pool.query(
      "UPDATE lists SET title=$2,photo_url=$3,updated_at=now() WHERE id=$1 RETURNING *",
      [id, data.title, data.photo_url],
    );
    if (!rows[0]) throw new HttpError(404, "Lista não encontrada.");
    return Response.json(rows[0]);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, ctx: Context) {
  try {
    checkOrigin(req);
    const id = uuid.parse((await ctx.params).id);
    const { rowCount } = await pool.query("DELETE FROM lists WHERE id=$1", [
      id,
    ]);
    if (!rowCount) throw new HttpError(404, "Lista não encontrada.");
    return new Response(null, { status: 204 });
  } catch (e) {
    return fail(e);
  }
}
