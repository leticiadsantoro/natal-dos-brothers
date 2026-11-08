import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-panel">
      <h1>Lista não encontrada</h1>
      <Link className="create" href="/">
        Voltar às listas
      </Link>
    </div>
  );
}
