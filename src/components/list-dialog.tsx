"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { ImagePicker } from "./image-picker";
import { json, message, request } from "@/lib/client";
import type { GiftList, ImageChoice } from "@/lib/types";
export function ListDialog({
  list,
  onClose,
}: {
  list?: GiftList;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(list?.title ?? ""),
    [photo, setPhoto] = useState<ImageChoice | null>(
      list?.photo_url ? { url: list.photo_url, credit: null } : null,
    ),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request<GiftList>(
        list ? "/api/lists/" + list.id : "/api/lists",
        json(list ? "PATCH" : "POST", {
          title: name.trim(),
          photo_url: photo?.url ?? null,
        }),
      );
      onClose();
      if (!list) router.push("/listas/" + result.id);
      router.refresh();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }
  return (
    <Modal
      title={list ? "Editar lista" : "Minha lista de presentes"}
      onClose={onClose}
      busy={busy || uploading}
    >
      <form onSubmit={save}>
        <fieldset disabled={busy || uploading}>
          <label htmlFor="list-name">Seu nome</label>
          <input
            id="list-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Como seus amigos te chamam?"
            required
            autoComplete="given-name"
          />
          <ImagePicker
            label="Foto de perfil"
            value={photo}
            onChange={setPhoto}
            allowSearch={false}
            onBusy={setUploading}
          />
        </fieldset>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="primary wide"
          disabled={busy || uploading}
        >
          {uploading
            ? "Enviando foto…"
            : busy
              ? "Salvando…"
              : list
                ? "Salvar alterações"
                : "Criar minha lista"}
        </button>
      </form>
    </Modal>
  );
}
export function CreateListButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="create" onClick={() => setOpen(true)}>
        Criar minha lista de presentes
      </button>
      <p className="create-limit-note">Valor máximo do presente R$50,00</p>
      {open && <ListDialog onClose={() => setOpen(false)} />}
    </>
  );
}
