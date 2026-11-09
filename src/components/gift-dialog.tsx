"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { ImagePicker } from "./image-picker";
import { json, message, request } from "@/lib/client";
import type { Gift, ImageChoice } from "@/lib/types";
export function GiftDialog({
  listId,
  gift,
  onClose,
}: {
  listId: string;
  gift?: Gift;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(gift?.title ?? ""),
    [productUrl, setProductUrl] = useState(gift?.product_url ?? ""),
    [image, setImage] = useState<ImageChoice | null>(
      gift ? { url: gift.image_url, credit: gift.image_credit } : null,
    ),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !image) {
      setError("Informe o título e escolha uma imagem do presente.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request(
        gift ? "/api/gifts/" + gift.id : "/api/lists/" + listId + "/gifts",
        json(gift ? "PATCH" : "POST", {
          title: title.trim(),
          image_url: image.url,
          image_credit: image.credit,
          product_url: productUrl.trim() || null,
        }),
      );
      onClose();
      router.refresh();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }
  async function remove() {
    if (!gift) return;
    setBusy(true);
    setError("");
    try {
      await request("/api/gifts/" + gift.id, { method: "DELETE" });
      setConfirm(false);
      onClose();
      router.refresh();
    } catch (e) {
      setError(message(e));
      setConfirm(false);
      setBusy(false);
    }
  }
  return (
    <>
      <Modal
        title={gift ? "Editar presente" : "Adicionar presente"}
        onClose={onClose}
        busy={busy || uploading || confirm}
      >
        {!gift && (
          <p className="gift-limit-tag">Valor máximo do presente R$50,00</p>
        )}
        <form onSubmit={save}>
          <fieldset disabled={busy || uploading || confirm}>
            <label htmlFor="gift-title">Título do presente</label>
            <input
              id="gift-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Fone de ouvido vermelho"
              required
              maxLength={150}
            />
            <label htmlFor="gift-link">Link do presente (opcional)</label>
            <input
              id="gift-link"
              type="url"
              inputMode="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://www.loja.com.br/produto"
              maxLength={2048}
              autoComplete="url"
            />
            <ImagePicker
              value={image}
              onChange={setImage}
              onBusy={setUploading}
              disabled={busy || confirm}
            />
          </fieldset>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary wide"
            type="submit"
            disabled={busy || uploading || confirm}
          >
            {uploading
              ? "Enviando foto…"
              : busy
                ? "Salvando…"
                : gift
                  ? "Salvar alterações"
                  : "Adicionar à lista"}
          </button>
          {gift && (
            <button
              className="danger wide"
              type="button"
              disabled={busy || uploading || confirm}
              onClick={() => {
                setError("");
                setConfirm(true);
              }}
            >
              Excluir presente
            </button>
          )}
        </form>
      </Modal>
      {confirm && (
        <Modal
          title="Excluir este presente?"
          onClose={() => setConfirm(false)}
          busy={busy}
          small
        >
          <p className="muted">
            O presente <strong>{gift?.title}</strong> será removido da lista.
            Essa ação não pode ser desfeita.
          </p>
          <div className="confirm-actions">
            <button
              type="button"
              className="outline"
              disabled={busy}
              onClick={() => setConfirm(false)}
              autoFocus
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Excluindo…" : "Sim, excluir"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
