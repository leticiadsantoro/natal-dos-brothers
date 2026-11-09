import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { uuid } from "@/lib/validation";
import type { Gift, GiftList } from "@/lib/types";
import { ListContent } from "@/components/list-content";
export const dynamic = "force-dynamic";
export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { rows } = await pool.query<GiftList>(
    "SELECT id,title,photo_url FROM lists WHERE id=$1",
    [id],
  );
  if (!rows[0]) notFound();
  const { rows: gifts } = await pool.query<Gift>(
    "SELECT id,list_id,title,image_url,image_credit,product_url FROM gifts WHERE list_id=$1 ORDER BY created_at,id",
    [id],
  );
  return <ListContent list={rows[0]} gifts={gifts} />;
}
