import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  if (error instanceof SyntaxError)
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json(
    {
      error: "Não foi possível salvar ou consultar os dados. Tente novamente.",
    },
    { status: 500 },
  );
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const url = new URL(req.url);
  const requestOrigin = `${url.protocol}//${req.headers.get("host") ?? url.host}`;
  if (origin && origin !== requestOrigin)
    throw new HttpError(403, "Origem não permitida.");
}
export async function body(req: Request) {
  checkOrigin(req);
  const text = await req.text();
  if (text.length > 70000) throw new HttpError(413, "Requisição muito grande.");
  return JSON.parse(text);
}
