import { fail, HttpError } from "@/lib/http";
export const dynamic = "force-dynamic";
const plain = (value: string = "") =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .slice(0, 500);
type Info = {
  thumburl?: string;
  url: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string }>;
};
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2 || q.length > 120)
      throw new HttpError(400, "Pesquise entre 2 e 120 caracteres.");
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: q + " filetype:bitmap",
      gsrnamespace: "6",
      gsrlimit: "18",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "600",
      iiextmetadatafilter: "Artist|LicenseShortName",
    });
    const result = await fetch(
      "https://commons.wikimedia.org/w/api.php?" + params,
      {
        headers: {
          "User-Agent": "SiteNatal/1.0 (gift-list image search; local project)",
        },
        signal: AbortSignal.timeout(12000),
        next: { revalidate: 300 },
      },
    );
    if (!result.ok)
      throw new HttpError(
        502,
        "A pesquisa de imagens está indisponível. Tente novamente ou envie uma foto.",
      );
    const data = await result.json();
    if (data.error)
      throw new HttpError(
        502,
        "Não foi possível pesquisar agora. Tente novamente.",
      );
    const pages = Object.values(data.query?.pages ?? {}) as {
      pageid: number;
      title: string;
      imageinfo?: Info[];
    }[];
    return Response.json(
      pages.flatMap((page) => {
        const i = page.imageinfo?.[0];
        if (!i) return [];
        const url = i.thumburl ?? i.url;
        if (!url.startsWith("https://upload.wikimedia.org/")) return [];
        return [
          {
            id: page.pageid,
            title: page.title.replace(/^File:/, ""),
            url,
            credit: {
              source: i.descriptionurl,
              author:
                plain(i.extmetadata?.Artist?.value) || "Wikimedia Commons",
              license:
                plain(i.extmetadata?.LicenseShortName?.value) ||
                "Ver licença na fonte",
            },
          },
        ];
      }),
    );
  } catch (e) {
    if (e instanceof Error && ["TimeoutError", "AbortError"].includes(e.name))
      return fail(
        new HttpError(
          504,
          "A pesquisa demorou demais. Tente novamente ou envie uma foto.",
        ),
      );
    return fail(e);
  }
}
