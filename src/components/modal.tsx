"use client";
import { useEffect, useRef, useId, type ReactNode } from "react";
export function Modal({
  title,
  children,
  onClose,
  busy = false,
  small = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  small?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`letter ${small ? "small" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      // O estado do componente controla o fechamento pelos botões, Escape
      // e clique fora. Não propagar o evento nativo "close": o cleanup
      // do efeito também o dispara durante o replay do Strict Mode.
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <button
        type="button"
        className="close"
        aria-label="Fechar modal"
        onClick={onClose}
        disabled={busy}
      >
        ×
      </button>
      <div className="letter-top" aria-hidden="true">
        <span>UMA CARTINHA DE NATAL</span>
        <span className="stamp">♡</span>
      </div>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
