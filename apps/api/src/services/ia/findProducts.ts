import { getGroq } from "@/infra/groq";
import { IProduct, IProductCategory } from "types";
import { normalize } from "../text/normalize";

export async function findProductsIA2(products: IProduct[], msg: string) {
  const menuJsonString = JSON.stringify(
    products.map((prod) => {
      const rProd = {
        id: prod.id,
        name: normalize(prod.name),
        sales: prod.sales,
      } as IProduct;

      if (prod.tags?.length) rProd.tags = prod.tags.map((x) => normalize(x));

      if (prod.description?.length)
        rProd.description = normalize(prod.description);

      return rProd;
    }),

    // categories.map((cat) => {

    //   const rCat = {
    //     id: cat.id,
    //     name: cat.name,
    //     position: cat.position,
    //     sort: cat.sort,
    //     products,
    //   } as IProductCategory;

    //   if (cat.tags?.length) rCat.tags = cat.tags;

    //   if (cat.description?.length) rCat.description = cat.description;

    //   return rCat;
    // }),
    null,
    2
  );

  const prompt = `Você é uma FUNÇÃO de extração de pedidos.

Objetivo:
Ler a mensagem do cliente e retornar SOMENTE os produtos do cardápio que ele solicitou, com suas quantidades.

CARDÁPIO REAL:
${menuJsonString}

SAÍDA OBRIGATÓRIA (JSON PURO):
{
  "products": [
    { "id": "string", "name": "string", "quantity": number }
  ]
}

REGRAS ABSOLUTAS:
- Nunca escreva textos fora do JSON.
- Nunca liste produtos não solicitados.
- Nunca liste produtos com quantity = 0.
- Nunca invente produtos ou ids.
- Nunca retorne o cardápio.
- Nunca repita produtos: se o cliente pedir mais de um, some na quantity.
- Se o usuário mencionar algo que não existe no cardápio, ignore.
- Se nada do cardápio for solicitado, retorne { "products": [] }.
- Se disser quantidade, use exatamente esse número.
- Se não disser, quantity = 1.
- Para nomes ambíguos ("pastel"), escolha o produto com maior “sales”.
- Priorize correspondência exata de nome antes de fuzzy match.

IMPORTANTE:
- A resposta deve ser sempre JSON válido.
- Nunca inclua campos além de id, name e quantity.
`;

  const prompt2 = `Você é uma FUNÇÃO de extração de pedidos.

Objetivo único:
Ler a mensagem do cliente e retornar apenas os produtos encontrados no cardápio com suas quantidades.

ENTRADA:
- Texto do cliente
- Cardápio em JSON

SAÍDA OBRIGATÓRIA (JSON PURO):

{
  products: { "id": string, "name": string, "quantity": number }[]
}

REGRAS ABSOLUTAS:
- Não escreva texto, explicações ou comentários.
- Nunca use objetos vazios ({}).
- Nunca retorne o cardápio completo.
- Nunca invente produtos ou ids.
- Nunca confunda sabores ou produtos. Retorne ESTRITAMENTE APENAS o solicitado
- Nunca repita o mesmo produto. Aumente quantity se necessário
- Nunca retorne mais ou menos produtos do que o solicitados
- Nunca repita a quantidade entre os produtos a menos que o cliente especifique.
- Você NUNCA deve criar produtos que não existam no CARDÁPIO fornecido.
- Você NUNCA deve criar ou modificar ids.
- Se o usuário sugerir um produto que não existe, retorne [].
- Se o usuário enviar um array de items para adicionar, retorne apenas os items cujo id exista no CARDÁPIO. Não adicione novos items.
- Responda APENAS com JSON PURO no formato:
  { "products": [ { "id": "string", "name": "string", "quantity": number } ] }
- Se nenhum id/nome do cardápio corresponder, retorne { "products": [] }.

LÓGICA:
- Se o cliente disser quantidade, use exatamente este número.
- Sempre priorize encontrar produtos com o nome exatamente igual, ex: "quero um pastel de frango": procure primeiramente um produto que seja exatamente o quase igual
- Se não disser quantidade, use 1.
- Se o cliente for ambíguo (ex: "pastel") escolha UM único produto pelo maior número de vendas (sales).

IMPORTANTE:
Se a resposta não for JSON válido, o sistema irá falhar.

CARDÁPIO:
${menuJsonString}`;

  console.log(prompt, menuJsonString);

  const result = await getGroq(prompt.trim(), msg, 2);

  return (
    Array.isArray(result)
      ? result
      : result?.id
      ? [result]
      : Array.isArray(result?.products)
      ? result.products
      : []
  ) as any[];
}

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedProduct {
  candidates: { id: string; accuracy: number; original?: IProduct }[];
  quantity: number;
  chunkOfText: string;
}

export async function findProductsIA(
  products: IProduct[],
  msg: string
): Promise<ExtractedProduct[]> {
  //description?,
  const systemPrompt = `
Você é uma função de EXTRAÇÃO DE PRODUTOS para um sistema de delivery.
Sua única tarefa é analisar um texto do cliente e identificar produtos que estejam no cardápio fornecido.

REGRAS FUNDAMENTAIS:
- Nunca invente produtos.
- Nunca retorne produtos que não estejam no cardápio.
- Nunca retorne mais candidatos do que os estritamente necessários.
- Nunca adicione textos fora do JSON final.
- Nunca responda com explicações, apenas o JSON.
- Nunca crie observações (notes) não explícitas claramente, ex: "sem cebola", "mais branquinho"
- Se o cliente disser um produto muito ambíguo e não especificar sabores, retorne os candidatos possíveis, ou o que mais se encaixa no solicitado.
- Se o cliente disser um produto que não existe no cardápio, retorne os candidatos vazios para esse trecho
ENTRADA:
- Texto do cliente (mensagem).
- Cardápio: array de IProduct, contendo:
  { id, name, tags[], sales }

OBJETIVO:
Retornar um array onde cada elemento representa um item citado no texto do cliente.

ESTRUTURA JSON DA RESPOSTA (OBRIGATÓRIA):
{
  products: [
    {
      candidates: [
        { id: string, accuracy: number }
      ],
      quantity: number,
      notes?: string
      chunkOfText: string
    }
  ]
}

REGRAS DETALHADAS (SIGA À RISCA):

1) Divida o texto do cliente em pequenos trechos (“chunkOfText”) referentes a cada pedido detectado.

2) Para cada chunk:
   - Priorize correspondência exata do nome do produto.
   - Depois correspondência com tags.
   - Depois fuzzy match (somente se necessário).

3) Produtos parecidos:
   Priorize o nome mais completo se o texto tiver detalhes adicionais.

4) SALES para DESEMPATE:
   - Diferença >= 100 → escolha apenas o mais vendido. (Em caso de ambiguidade muito rasa, ignore. 
   Ex: "quero um Refrigerante" → não retorne um refrigerante específico)
   - Diferença < 100 → retorne ambos com accuracy dividida.

5) ACCURACY:
   - Match exato: 95–100
   - Match parcial: 60–80
   - Por tag: 70–90
   - Fuzzy: 40–60

6) Quantidade:
   Detecte “2”, “dois”, “uma”, “1”, etc.

7) Ignore completamente qualquer trecho que não descreva produtos do cardápio.
   Não inclua no JSON itens relacionados a pagamento, endereço, dúvidas, saudações ou qualquer outro assunto que não seja produto.

8) Se nenhum produto for encontrado: retorne [].


RESPOSTA FINAL: APENAS o JSON.
`;

  const userPrompt = `
mensagem do cliente:
${msg}

cardapio:
${JSON.stringify(
  products.map((prod) => {
    const rProd = {
      id: prod.id,
      name: normalize(prod.name),
      sales: prod.sales,
    } as IProduct;

    if (prod.tags?.length) rProd.tags = prod.tags.map((x) => normalize(x));

    // if (prod.description?.length)
    //   rProd.description = normalize(prod.description);

    return rProd;
  })
)}

Retorne apenas o array JSON conforme as regras.
  `.trim();

  console.log(userPrompt);
  // console.log(userPrompt);

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    // max_completion_tokens: 500,
    response_format: { type: "json_object" },
    // response_format: {
    //   type: "json_schema",
    //   json_schema: {
    //     name: "product_extraction",
    //     schema: {
    //       type: "object",
    //       properties: {
    //         products: {
    //           type: "array",
    //           items: {
    //             type: "object",
    //             properties: {
    //               candidates: {
    //                 type: "array",
    //                 items: {
    //                   type: "object",
    //                   properties: {
    //                     id: { type: "string" },
    //                     accuracy: { type: "number" },
    //                   },
    //                   required: ["id", "accuracy"],
    //                 },
    //               },
    //               quantity: { type: "number" },
    //               chunkOfText: { type: "string" },
    //             },
    //             required: ["candidates", "quantity", "chunkOfText"],
    //           },
    //         },
    //       },
    //       required: ["products"],
    //       additionalProperties: false,
    //     },
    //   },
    // },
  });

  const raw = response.choices[0].message.content;

  // console.log(raw);

  try {
    const result = JSON.parse(raw || "[]");

    return (
      Array.isArray(result)
        ? result
        : result?.id
        ? [result]
        : Array.isArray(result?.products)
        ? result.products
        : []
    ) as any[];
  } catch (err) {
    console.error("Erro ao parsear resposta da IA:", raw);
    return [];
  }
}
