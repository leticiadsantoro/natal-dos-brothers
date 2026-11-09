import { z } from "zod";
export const uuid = z.string().uuid();
export const imageUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (/^\/api\/images\/[0-9a-f-]{36}$/.test(value))
      return uuid.safeParse(value.split("/").at(-1)).success;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "upload.wikimedia.org" &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Escolha uma imagem enviada ou da pesquisa.");
export const credit = z
  .object({
    source: z
      .url()
      .max(2048)
      .refine((v) => new URL(v).hostname === "commons.wikimedia.org"),
    author: z.string().max(500),
    license: z.string().max(200),
  })
  .nullable()
  .default(null);
export const productUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Informe um link válido começando com https:// ou http://.")
  .transform((value) => value || null)
  .nullable()
  .default(null);
export const giftInput = z.object({
  title: z.string().trim().min(1, "Informe o título.").max(150),
  image_url: imageUrl,
  image_credit: credit,
  product_url: productUrl,
});
export const listInput = z.object({
  title: z.string().trim().min(1, "Informe o nome.").max(80),
  photo_url: imageUrl.nullable().default(null),
});
export const createListInput = listInput.extend({
  gifts: z.array(giftInput).max(12).default([]),
});
