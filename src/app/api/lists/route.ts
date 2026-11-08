import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import { body, fail } from "@/lib/http";
import { createListInput } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT l.id,l.title,l.photo_url,count(g.id)::int AS gift_count FROM lists l LEFT JOIN gifts g ON g.list_id=l.id GROUP BY l.id ORDER BY l.created_at DESC,l.id`,
    );
    return Response.json(rows);
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: Request) {
  let client;
  try {
    const data = createListInput.parse(await body(req));
    client = await pool.connect();
    await client.query("BEGIN");
    const id = randomUUID();
    const { rows } = await client.query(
      "INSERT INTO lists (id,title,photo_url) VALUES ($1,$2,$3) RETURNING *",
      [id, data.title, data.photo_url],
    );
    for (const gift of data.gifts)
      await client.query(
        "INSERT INTO gifts (id,list_id,title,image_url,image_credit) VALUES ($1,$2,$3,$4,$5)",
        [randomUUID(), id, gift.title, gift.image_url, gift.image_credit],
      );
    await client.query("COMMIT");
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    if (client) await client.query("ROLLBACK");
    return fail(e);
  } finally {
    client?.release();
  }
}
