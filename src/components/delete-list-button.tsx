"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { request, message } from "@/lib/client";
import type { GiftList } from "@/lib/types";

export function DeleteListButton({ list }: { list: GiftList }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await request(`/api/lists/${list.id}`, { method: "DELETE" });
      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="danger"
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Excluir lista de presentes
      </button>
      {open && (
        <Modal
          title="Excluir lista de presentes?"
          onClose={() => setOpen(false)}
          busy={busy}
          small
        >
          <p className="muted">
            A lista de <strong>{list.title}</strong> e todos os seus presentes
            serão excluídos. Essa ação não pode ser desfeita.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="confirm-actions">
            <button
              className="outline"
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              autoFocus
            >
              Cancelar
            </button>
            <button
              className="primary"
              type="button"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Excluindo…" : "Sim, excluir lista"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
