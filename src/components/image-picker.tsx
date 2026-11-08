"use client";
import { useEffect, useId, useRef, useState } from "react";
import { message, request, upload } from "@/lib/client";
import type { Credit, ImageChoice } from "@/lib/types";
type Result = { id: number; title: string; url: string; credit: Credit };
export function ImagePicker({
  value,
  onChange,
  onBusy,
  allowSearch = true,
  label = "Imagem do presente",
  disabled = false,
}: {
  value: ImageChoice | null;
  onChange: (v: ImageChoice | null) => void;
  onBusy: (busy: boolean) => void;
  allowSearch?: boolean;
  label?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<Result[]>([]),
    [searched, setSearched] = useState(false),
    [searching, setSearching] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function pick(file: File) {
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      onChange(await upload(file));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  async function find() {
    if (query.trim().length < 2) {
      setError("Digite ao menos 2 caracteres para pesquisar.");
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setSearching(true);
    setError("");
    setSearched(false);
    try {
      const data = await request<Result[]>(
        "/api/image-search?q=" + encodeURIComponent(query.trim()),
        { signal: controller.signal },
      );
      setResults(data);
      setSearched(true);
    } catch (e) {
      if (!controller.signal.aborted) setError(message(e));
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }
  return (
    <div className="image-picker">
      <label htmlFor={id}>{label}</label>
      {value && (
        <div className="chosen-image">
          <img src={value.url} alt={label} />
          <button
            className="text-button"
            type="button"
            disabled={disabled || busy}
            onClick={() => onChange(null)}
          >
            Remover foto
          </button>
        </div>
      )}
      <div className="upload">
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
            e.target.value = "";
          }}
        />
        <small>JPG, PNG, WebP ou GIF · até 10 MB</small>
      </div>
      {busy && (
        <p className="muted" role="status">
          Enviando foto…
        </p>
      )}
      {allowSearch && (
        <button
          type="button"
          className="outline wide search-toggle"
          aria-expanded={search}
          disabled={disabled || busy}
          onClick={() => setSearch(!search)}
        >
          ⌕ {search ? "Fechar pesquisa" : "Pesquisar imagens"}
        </button>
      )}
      {search && (
        <div className="search-area">
          <label htmlFor={id + "search"}>O que você está procurando?</label>
          <div className="search-row">
            <input
              id={id + "search"}
              maxLength={120}
              value={query}
              placeholder="Ex.: tênis, livro, fone de ouvido"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void find();
                }
              }}
            />
            <button
              className="primary"
              type="button"
              disabled={disabled || searching || busy}
              onClick={() => void find()}
            >
              {searching ? "Buscando…" : "Buscar"}
            </button>
          </div>
          <p className="muted fine">
            Imagens do Wikimedia Commons. Tente também termos em inglês.
          </p>
          {searched && !results.length && (
            <p className="muted" role="status">
              Nenhuma imagem encontrada. Tente outro termo ou envie uma foto.
            </p>
          )}
          <div className="search-results">
            {results.map((r) => (
              <div className="search-result" key={r.id}>
                <button
                  type="button"
                  disabled={disabled}
                  className={value?.url === r.url ? "selected" : ""}
                  onClick={() => {
                    onChange({ url: r.url, credit: r.credit });
                    setSearch(false);
                  }}
                  aria-label={"Usar imagem: " + r.title}
                >
                  <img src={r.url} alt={r.title} loading="lazy" />
                  <span>{r.title}</span>
                </button>
                <a href={r.credit.source} target="_blank" rel="noreferrer">
                  {r.credit.license} · fonte ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {value?.credit && (
        <p className="muted fine">
          {value.credit.author} ·{" "}
          <a href={value.credit.source} target="_blank" rel="noreferrer">
            {value.credit.license} · Wikimedia Commons
          </a>
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
