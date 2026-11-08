import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import sharp from "sharp";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const createdLists = [],
  createdImages = [];
const json = (method, data) => ({
  method,
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify(data),
});
async function call(path, options) {
  const res = await fetch(base + path, options);
  const data = res.status === 204 ? null : await res.json();
  return { status: res.status, data };
}
test("fluxo completo: listas, fotos, presentes, edição pública e exclusão", async (t) => {
  try {
    const png = await sharp({
      create: { width: 30, height: 30, channels: 3, background: "#c50904" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set("file", new File([png], "presente.png", { type: "image/png" }));
    const uploaded = await call("/api/uploads", { method: "POST", body: form });
    assert.equal(uploaded.status, 201);
    const image = uploaded.data.url;
    createdImages.push(image.split("/").at(-1));
    const imageResponse = await fetch(base + image);
    assert.equal(imageResponse.status, 200);
    assert.equal(imageResponse.headers.get("content-type"), "image/webp");
    assert.ok((await imageResponse.arrayBuffer()).byteLength > 0);
    const result = await call(
      "/api/lists",
      json("POST", {
        title: "Teste temporário de Natal",
        photo_url: image,
        gifts: [{ title: "Livro inicial", image_url: image }],
      }),
    );
    assert.equal(result.status, 201);
    const list = result.data;
    createdLists.push(list.id);
    let detail = await call("/api/lists/" + list.id);
    assert.equal(detail.data.title, "Teste temporário de Natal");
    assert.equal(detail.data.gifts.length, 1);
    assert.equal(detail.data.photo_url, image);
    const all = await call("/api/lists");
    assert.equal(all.data.find((l) => l.id === list.id).gift_count, 1);
    const renamed = await call(
      "/api/lists/" + list.id,
      json("PATCH", { title: "Amiga de Natal", photo_url: null }),
    );
    assert.equal(renamed.status, 200);
    assert.equal(renamed.data.photo_url, null);
    const added = await call(
      "/api/lists/" + list.id + "/gifts",
      json("POST", { title: "Tênis vermelho", image_url: image }),
    );
    assert.equal(added.status, 201);
    const changed = await call(
      "/api/gifts/" + added.data.id,
      json("PATCH", { title: "Fone de ouvido", image_url: image }),
    );
    assert.equal(changed.status, 200);
    assert.equal(changed.data.title, "Fone de ouvido");
    // Outra requisição, sem cookies ou autenticação, lê a alteração persistida.
    detail = await call("/api/lists/" + list.id);
    assert.equal(detail.data.gifts.length, 2);
    assert.equal(
      detail.data.gifts.find((g) => g.id === added.data.id).title,
      "Fone de ouvido",
    );
    const page = await fetch(base + "/listas/" + list.id);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes("Amiga de Natal"));
    assert.ok(html.includes("Fone de ouvido"));
    const removed = await call("/api/gifts/" + added.data.id, {
      method: "DELETE",
    });
    assert.equal(removed.status, 204);
    detail = await call("/api/lists/" + list.id);
    assert.equal(detail.data.gifts.length, 1);
    assert.equal(
      (await call("/api/gifts/" + added.data.id, { method: "DELETE" })).status,
      404,
    );
    await t.test("entradas inválidas são recusadas", async () => {
      assert.equal(
        (await call("/api/lists", json("POST", { title: "  " }))).status,
        400,
      );
      assert.equal(
        (
          await call(
            "/api/lists/" + list.id + "/gifts",
            json("POST", {
              title: "Foto inválida",
              image_url: "http://127.0.0.1:54329/private",
            }),
          )
        ).status,
        400,
      );
      assert.equal((await call("/api/lists/not-a-uuid")).status, 400);
      const evil = {
        ...json("PATCH", { title: "Não deve alterar", photo_url: null }),
        headers: {
          "Content-Type": "application/json",
          Origin: "https://example.org",
        },
      };
      assert.equal((await call("/api/lists/" + list.id, evil)).status, 403);
      const bad = new FormData();
      bad.set(
        "file",
        new File(["não é uma foto"], "x.png", { type: "image/png" }),
      );
      assert.equal(
        (await call("/api/uploads", { method: "POST", body: bad })).status,
        400,
      );
      assert.equal((await call("/api/image-search?q=a")).status, 400);
    });
    await t.test("excluir lista remove também seus presentes", async () => {
      const rejected = await call("/api/lists/" + list.id, {
        method: "DELETE",
        headers: { Origin: "https://example.org" },
      });
      assert.equal(rejected.status, 403);
      assert.equal((await call("/api/lists/" + list.id)).status, 200);
      const deleted = await call("/api/lists/" + list.id, {
        method: "DELETE",
        headers: { Origin: base },
      });
      assert.equal(deleted.status, 204);
      assert.equal((await call("/api/lists/" + list.id)).status, 404);
      const remaining = await pool.query(
        "SELECT id FROM gifts WHERE list_id=$1",
        [list.id],
      );
      assert.equal(remaining.rowCount, 0);
      assert.ok(
        !(await call("/api/lists")).data.some((item) => item.id === list.id),
      );
      assert.equal(
        (await call("/api/lists/" + list.id, { method: "DELETE" })).status,
        404,
      );
    });
  } finally {
    for (const id of createdLists)
      await pool.query("DELETE FROM lists WHERE id=$1", [id]);
    for (const id of createdImages)
      await pool.query("DELETE FROM images WHERE id=$1", [id]);
    await pool.end();
  }
});
