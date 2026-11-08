import Link from "next/link";
import { pool } from "@/lib/db";
import type { GiftList } from "@/lib/types";
import { CreateListButton } from "@/components/list-dialog";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { rows: lists } = await pool.query<GiftList>(
    "SELECT l.id,l.title,l.photo_url,count(g.id)::int AS gift_count FROM lists l LEFT JOIN gifts g ON g.list_id=l.id GROUP BY l.id ORDER BY l.created_at DESC,l.id",
  );
  return (
    <>
      <div className="home-create">
        <CreateListButton />
      </div>
      <h1 className="sr-only">Listas de presentes dos amigos</h1>
      <div className="people-grid">
        {lists.map((list) => (
          <Link className="person" href={"/listas/" + list.id} key={list.id}>
            {list.photo_url ? (
              <img
                className="avatar"
                src={list.photo_url}
                alt={"Foto de " + list.title}
              />
            ) : (
              <span className="avatar monogram" aria-hidden="true">
                {list.title.slice(0, 1).toLocaleUpperCase("pt-BR")}
              </span>
            )}
            <span className="person-name">{list.title}</span>
            <span className="person-count">
              {list.gift_count ?? 0}{" "}
              {list.gift_count === 1 ? "presente" : "presentes"}
            </span>
            <span className="person-link">
              Ver lista <span aria-hidden="true">↗</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
