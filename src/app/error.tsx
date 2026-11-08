"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-panel" role="alert">
      <h1>Não foi possível carregar as listas.</h1>
      <p>Tente novamente em instantes.</p>
      <button className="create" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
