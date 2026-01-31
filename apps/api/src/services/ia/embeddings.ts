import { IProduct } from "types";
import { openAIClient } from "@/infra/openai";
import { join } from "../text/join";

export async function buildMenuEmbeddings(menu: IProduct[]) {
  // concatenar fields relevantes
  const inputs = menu.map((p) =>
    join([p.name, p.description, p.tags?.join(" ") ?? ""], " ")
  );

  // chama o endpoint de embeddings (batch)
  const res = await openAIClient.embeddings.create({
    model: "text-embedding-3-small",
    input: inputs,
  });

  // res.data é array com embedding vectors
  return menu.map((p, idx) => ({
    id: p.id,
    sales: p.sales,
    name: p.name,
    emb: res.data[idx].embedding as number[],
  }));
}
