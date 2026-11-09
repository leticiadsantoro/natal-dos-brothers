import { pool } from "@/lib/db";
import { body, checkOrigin, fail, HttpError } from "@/lib/http";
import { uuid, giftInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, ctx: Context) {
  try {
    const id = uuid.parse((await ctx.params).id);
    const data = giftInput.parse(await body(req));
    const { rows } = await pool.query(
      "UPDATE gifts SET title=$2,image_url=$3,image_credit=$4,product_url=$5,updated_at=now() WHERE id=$1 RETURNING *",
      [id, data.title, data.image_url, data.image_credit, data.product_url],
    );
    if (!rows[0]) throw new HttpError(404, "Presente não encontrado.");
    return Response.json(rows[0]);
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    checkOrigin(req);
    const id = uuid.parse((await ctx.params).id);
    const { rowCount } = await pool.query("DELETE FROM gifts WHERE id=$1", [
      id,
    ]);
    if (!rowCount) throw new HttpError(404, "Presente não encontrado.");
    return new Response(null, { status: 204 });
  } catch (e) {
    return fail(e);
  }
}
