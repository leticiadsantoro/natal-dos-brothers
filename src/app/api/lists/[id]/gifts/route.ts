import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import { body, fail, HttpError } from "@/lib/http";
import { uuid, giftInput } from "@/lib/validation";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const id = uuid.parse((await ctx.params).id);
    const data = giftInput.parse(await body(req));
    const { rows } = await pool.query(
      "INSERT INTO gifts (id,list_id,title,image_url,image_credit) SELECT $1,id,$3,$4,$5 FROM lists WHERE id=$2 RETURNING *",
      [randomUUID(), id, data.title, data.image_url, data.image_credit],
    );
    if (!rows[0]) throw new HttpError(404, "Lista não encontrada.");
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
