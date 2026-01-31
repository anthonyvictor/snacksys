// import { getGroq } from "@/infra/groq";
// import { IChat, IntentResult } from "types";
// import { Mistral } from "@mistralai/mistralai";

// export async function extractAddressIA2(text: string) {
//   // ex: Rua Lauro de Freitas, Avenida Aliomar Baleeiro, Ladeira do Jardim Zoológico, Beco do amor (Nunca invente)
//   // ex: Ondina, Alto do Coqueirinho, Rio Vermelho, São Cristóvão, Itinga (Nunca invente)
//   // ex: Edificio Jandira, Apartamento 202, Bloco B, 1 andar (Nunca invente)
//   // ex: Ao lado do bar de Tonho, Em frente ao mercadinho, Em cima da casa de Manoel, Perto da pracinha (Nunca invente)
//   // endereço completo bruto, por extenso do jeito que o cliente digitou (é obrigatório)

//   const extractTools = [
//     {
//       type: "function" as const,
//       function: {
//         name: "extract_address_details",
//         description:
//           "Extrai o tipo de pedido e detalhes do endereço se fornecidos.",
//         parameters: {
//           type: "object",
//           properties: {
//             type: {
//               type: "string",
//               enum: ["delivery", "pickup"],
//               description:
//                 "delivery para entrega (quando houver endereço ou intenção de entrega) e pickup para retirada.",
//             },
//             address: {
//               type: ["object", "null"], // Permite explicitamente ser nulo se não houver endereço
//               properties: {
//                 street: { type: "string" },
//                 neighborhood: { type: "string" },
//                 complement: { type: "string" },
//                 number: { type: "string" },
//                 reference: { type: "string" },
//                 zipCode: { type: "string" },
//               },
//               description:
//                 "Extraia EXATAMENTE como escrito. Se não houver dados de endereço, retorne null.",
//             },
//           },
//           required: ["type"],
//         },
//       },
//     },
//   ];

//   const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

//   const response = await client.chat.complete({
//     model: "mistral-small-latest",
//     messages: [
//       {
//         role: "system",
//         content: `Você é um extrator de dados para delivery.
//       REGRAS ABSOLUTAS:
//       1. Se o cliente mencionar rua, bairro, número ou entregar em algum lugar, type é "delivery".
//       2. Se o cliente disser que vai buscar ou retirar, type é "pickup".
//       3. Extraia os valores EXATAMENTE como digitados. Não corrija erros ortográficos.
//       4. Se não houver nenhum dado de endereço (rua, bairro, etc), preencha 'address' como null.`,
//       },
//       { role: "user", content: text },
//     ],
//     tools: extractTools,
//     toolChoice: "required",
//   });

//   const toolCall = response.choices?.[0]?.message.toolCalls?.[0];

//   if (toolCall) {
//     const data = JSON.parse(toolCall.function.arguments as string);
//     console.log("Resposta Mistral:", data);
//     return data;
//   }

//   // Exemplo de uso:

//   console.log(prompt, text);
//   const result = { intent: "unknown" };

//   return result as IntentResult;
// }

// /**
//  *
// askWorkingHours – horário de funcionamento.
// askRestaurantAddress – onde fica o restaurante.
// askWaitTime – tempo de preparo/espera.
// thank – agradecimentos.
// greeting – saudações. Ex: "oi", "boa noite", "boa".
// confirm – cliente faz uma confirmação breve. Ex: "sim", "ok", "exatamente", "ss".
// deny – cliente faz uma negação breve. Ex: "não", "negativo", "nop", "nn".
// askMenu – pedir cardápio, promoções ou disponibilidade.
// Ex: "tem pizza?", "manda o menu", "qual a promo?".
// continueOrder – cliente quer avançar. Ex: "continuar", "próximo".

//  */
// // - Se não houver produto explícito: "products": []
// // - Nunca inventar produto que o usuário não pediu.
// // - "observations" é observações do produto se houver.

// // Regras:
// // - pediu troco: method="cash"
// // - pediu chave: method="pix"
// // - 1 método: amount="total"
// // - 2 métodos: allow "half"
// // Formato de entities:
// // {
// // payments: [{ method: 'card'|'cash'|'pix'|'rest', amount: 'part'|'half'|'total'|number, changeFor?: number }],
// // }

// // askPix – pedido da chave pix.
// // Ex: Manda a chave, Qual é o pix?, Cadê o qr code, kd o numero do pix
// // Formato da resposta: {products?: [{ name: string, quantity: number, observations?: string }]}

import { Mistral } from "@mistralai/mistralai";
import { IntentResult } from "types";

// Função genérica de merge para evitar duplicatas em qualquer campo
export function mergeUniqueText(
  textoAtual: string | undefined,
  novoTexto: string | undefined,
): string {
  if (!novoTexto) return textoAtual || "";
  if (!textoAtual) return novoTexto;

  const normalizar = (txt: string) =>
    txt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .trim();

  const atualNorm = normalizar(textoAtual);
  const novoNorm = normalizar(novoTexto);

  if (atualNorm.includes(novoNorm)) return textoAtual;
  if (novoNorm.includes(atualNorm)) return novoTexto;

  // Se não houver sobreposição, concatena com vírgula
  return `${textoAtual}, ${novoTexto}`;
}

export async function extractAddressIA2(text: string) {
  const extractTools = [
    {
      type: "function" as const,
      function: {
        name: "extract_address_details",
        description: "Extrai intenção de entrega e detalhes geográficos.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["delivery", "pickup"],
              description: "delivery para entrega e pickup para retirada.",
            },
            address: {
              type: ["object", "null"],
              properties: {
                street: {
                  type: "string",
                  description:
                    "Apenas o nome do logradouro (Rua, Av, Travessa).",
                },
                neighborhood: {
                  type: "string",
                  description:
                    "Apenas o nome do bairro. Nunca coloque referências aqui.",
                },
                complement: { type: "string" },
                number: { type: "string" },
                reference: {
                  type: "string",
                  description:
                    "Pontos de referência, como 'perto da farmácia' ou 'descendo a pracinha'.",
                },
                zipCode: { type: "string" },
              },
            },
          },
          required: ["type"],
        },
      },
    },
  ];

  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "system",
        content: `Você é um especialista em logística. Extraia dados EXATAMENTE como escritos, mas siga estas regras de separação:

        1. NEIGHBORHOOD (Bairro): Deve conter APENAS o nome do bairro (Ex: São Cristóvão, Itinga). 
           - Erro Comum: Se o cliente disser "São Cristóvão perto da farmácia", bairro é "São Cristóvão" e referência é "perto da farmácia".
        2. STREET (Rua): Apenas o logradouro.
        3. REFERENCE: Tudo que descreva o local mas não faça parte do nome oficial (ex: "em cima de", "perto de", "descendo").

        EXEMPLO NEGATIVO: 
        Input: "travessa sao paulo sao cristovao perto da farmacia"
        JSON Correto: { "street": "travessa sao paulo", "neighborhood": "sao cristovao", "reference": "perto da farmacia" }
        JSON Errado: { "neighborhood": "sao cristovao perto da farmacia" }`,
      },
      { role: "user", content: text },
    ],
    tools: extractTools,
    toolChoice: "required",
  });

  const toolCall = response.choices?.[0]?.message.toolCalls?.[0];

  if (toolCall) {
    const data = JSON.parse(toolCall.function.arguments as string);
    return data;
  }

  return { type: "unknown" };
}
