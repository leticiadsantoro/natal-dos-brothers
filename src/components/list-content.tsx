"use client";
import Link from "next/link";
import { useState } from "react";
import type { Gift, GiftList } from "@/lib/types";
import { GiftDialog } from "./gift-dialog";
import { ListDialog } from "./list-dialog";
import { DeleteListButton } from "./delete-list-button";
export function ListContent({
  list,
  gifts,
}: {
  list: GiftList;
  gifts: Gift[];
}) {
  const [editingList, setEditingList] = useState(false),
    [editor, setEditor] = useState<Gift | "new" | null>(null);
  return (
    <>
      <div className="list-letter">
        <div className="top-actions">
          <Link className="back" href="/">
            ← Todas as listas
          </Link>
          <DeleteListButton list={list} />
        </div>
        <section className="list-heading">
          <div className="identity">
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
            <div>
              <span className="eyebrow">LISTA DE PRESENTES DE</span>
              <h1>{list.title}</h1>
              <p>
                {gifts.length} {gifts.length === 1 ? "presente" : "presentes"}
              </p>
            </div>
          </div>
          <button
            className="light-outline"
            onClick={() => setEditingList(true)}
          >
            Editar nome e foto
          </button>
        </section>
        <div className="catalog-toolbar">
          <div className="catalog-description">
            <span>Ideias para presentear</span>
            <span className="gift-limit-tag">
              Valor máximo do presente R$50,00
            </span>
          </div>
          <button className="create compact" onClick={() => setEditor("new")}>
            + Adicionar presente
          </button>
        </div>
        {gifts.length ? (
          <div className="product-grid">
            {gifts.map((g) => (
              <article className="product" key={g.id}>
                <div className="product-image">
                  <img src={g.image_url} alt={g.title} loading="lazy" />
                </div>
                <div className="product-body">
                  <h2>{g.title}</h2>
                  {g.image_credit && (
                    <p className="credit">
                      {g.image_credit.author} ·{" "}
                      <a
                        href={g.image_credit.source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {g.image_credit.license} ↗
                      </a>
                    </p>
                  )}
                  <button className="outline wide" onClick={() => setEditor(g)}>
                    Editar presente
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <span aria-hidden="true">✧</span>
            <p>Esta lista ainda não tem presentes.</p>
            <button className="light-outline" onClick={() => setEditor("new")}>
              Adicionar o primeiro presente
            </button>
          </div>
        )}
      </div>
      {editingList && (
        <ListDialog list={list} onClose={() => setEditingList(false)} />
      )}{" "}
      {editor && (
        <GiftDialog
          listId={list.id}
          gift={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
